package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/streadway/amqp"
)

type Hotel struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	City        string   `json:"city"`
	Address     string   `json:"address"`
	Amenities   []string `json:"amenities"`
	Images      []string `json:"images"`
	Thumbnail   string   `json:"thumbnail"`
	AmadeusID   string   `json:"amadeus_id"`
	Available   bool     `json:"available"`
}

type SearchResult struct {
	Hotels []Hotel `json:"hotels"`
	Total  int     `json:"total"`
}

type SearchService struct {
	solrURL         string
	hotelServiceURL string
	userServiceURL  string
	channel         *amqp.Channel
}

type SolrDoc struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	City        string   `json:"city"`
	Address     string   `json:"address"`
	Amenities   []string `json:"amenities"`
	Images      []string `json:"images"`
	Thumbnail   string   `json:"thumbnail"`
	AmadeusID   string   `json:"amadeus_id"`
}

type SolrResponse struct {
	Response struct {
		NumFound int       `json:"numFound"`
		Docs     []SolrDoc `json:"docs"`
	} `json:"response"`
}

func main() {
	solrURL := os.Getenv("SOLR_URL")
	if solrURL == "" {
		solrURL = "http://localhost:8983"
	}

	hotelServiceURL := os.Getenv("HOTEL_SERVICE_URL")
	if hotelServiceURL == "" {
		hotelServiceURL = "http://localhost:8001"
	}

	userServiceURL := os.Getenv("USER_SERVICE_URL")
	if userServiceURL == "" {
		userServiceURL = "http://localhost:8003"
	}

	// RabbitMQ connection
	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	if rabbitmqURL == "" {
		rabbitmqURL = "amqp://guest:guest@localhost:5672/"
	}

	conn, err := amqp.Dial(rabbitmqURL)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal(err)
	}
	defer ch.Close()

	service := &SearchService{
		solrURL:         solrURL,
		hotelServiceURL: hotelServiceURL,
		userServiceURL:  userServiceURL,
		channel:         ch,
	}

	// Start listening for hotel updates
	go service.listenForHotelUpdates()

	router := gin.Default()

	// CORS middleware mejorado
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, User-Agent, Cache-Control, Keep-Alive")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	router.GET("/search", service.searchHotels)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	log.Printf("Search service running on port %s", port)
	router.Run(":" + port)
}

func (s *SearchService) searchHotels(c *gin.Context) {
	city := c.Query("city")
	checkIn := c.Query("check_in")
	checkOut := c.Query("check_out")

	if city == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "City parameter is required"})
		return
	}

	// Search in Solr
	query := fmt.Sprintf("city:%s", city)
	solrURL := fmt.Sprintf("%s/solr/hotels/select?q=%s&wt=json&rows=100", s.solrURL, query)

	resp, err := http.Get(solrURL)
	if err != nil {
		log.Printf("Error querying Solr: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search service unavailable"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read search results"})
		return
	}

	var solrResponse SolrResponse
	if err := json.Unmarshal(body, &solrResponse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse search results"})
		return
	}

	// Convert Solr docs to Hotel structs and check availability concurrently
	hotels := make([]Hotel, len(solrResponse.Response.Docs))
	var wg sync.WaitGroup

	for i, doc := range solrResponse.Response.Docs {
		wg.Add(1)
		go func(index int, solrDoc SolrDoc) {
			defer wg.Done()

			hotel := Hotel{
				ID:          solrDoc.ID,
				Name:        solrDoc.Name,
				Description: solrDoc.Description,
				City:        solrDoc.City,
				Address:     solrDoc.Address,
				Amenities:   solrDoc.Amenities,
				Images:      solrDoc.Images,
				Thumbnail:   solrDoc.Thumbnail,
				AmadeusID:   solrDoc.AmadeusID,
				Available:   true, // Default to true, check availability if dates provided
			}

			// Check availability if dates are provided
			if checkIn != "" && checkOut != "" {
				hotel.Available = s.checkAvailability(solrDoc.ID, checkIn, checkOut)
			}

			hotels[index] = hotel
		}(i, doc)
	}

	wg.Wait()

	// Filter only available hotels if dates were provided
	if checkIn != "" && checkOut != "" {
		var availableHotels []Hotel
		for _, hotel := range hotels {
			if hotel.Available {
				availableHotels = append(availableHotels, hotel)
			}
		}
		hotels = availableHotels
	}

	result := SearchResult{
		Hotels: hotels,
		Total:  len(hotels),
	}

	c.JSON(http.StatusOK, result)
}

func (s *SearchService) checkAvailability(hotelID, checkIn, checkOut string) bool {
	// Call user service to check availability
	url := fmt.Sprintf("%s/availability?hotel_id=%s&check_in=%s&check_out=%s",
		s.userServiceURL, hotelID, checkIn, checkOut)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error checking availability: %v", err)
		return false
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false
	}

	available, ok := result["available"].(bool)
	return ok && available
}

func (s *SearchService) listenForHotelUpdates() {
	q, err := s.channel.QueueDeclare(
		"hotel_updates",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	msgs, err := s.channel.Consume(
		q.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	for msg := range msgs {
		var update map[string]interface{}
		if err := json.Unmarshal(msg.Body, &update); err != nil {
			log.Printf("Error unmarshaling hotel update: %v", err)
			continue
		}

		action := update["action"].(string)
		hotelData := update["hotel"].(map[string]interface{})

		switch action {
		case "created", "updated":
			s.indexHotel(hotelData)
		case "deleted":
			s.deleteHotelFromIndex(hotelData["id"].(string))
		}
	}
}

func (s *SearchService) indexHotel(hotelData map[string]interface{}) {
	// Convert hotel data to Solr document
	doc := map[string]interface{}{
		"id":          hotelData["id"],
		"name":        hotelData["name"],
		"description": hotelData["description"],
		"city":        hotelData["city"],
		"address":     hotelData["address"],
		"amenities":   hotelData["amenities"],
		"images":      hotelData["images"],
		"thumbnail":   hotelData["thumbnail"],
		"amadeus_id":  hotelData["amadeus_id"],
	}

	solrDoc := []map[string]interface{}{doc}
	jsonData, err := json.Marshal(solrDoc)
	if err != nil {
		log.Printf("Error marshaling Solr document: %v", err)
		return
	}

	// Send to Solr
	url := fmt.Sprintf("%s/solr/hotels/update?commit=true", s.solrURL)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error indexing hotel in Solr: %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("Hotel indexed successfully: %s", hotelData["name"])
}

func (s *SearchService) deleteHotelFromIndex(hotelID string) {
	deleteDoc := map[string]interface{}{
		"delete": map[string]string{"id": hotelID},
	}

	jsonData, err := json.Marshal(deleteDoc)
	if err != nil {
		log.Printf("Error marshaling delete document: %v", err)
		return
	}

	url := fmt.Sprintf("%s/solr/hotels/update?commit=true", s.solrURL)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error deleting hotel from Solr: %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("Hotel deleted from index: %s", hotelID)
}
