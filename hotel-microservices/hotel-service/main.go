package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/streadway/amqp"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Hotel struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name          string             `bson:"name" json:"name"`
	Description   string             `bson:"description" json:"description"`
	City          string             `bson:"city" json:"city"`
	Address       string             `bson:"address" json:"address"`
	Amenities     []string           `bson:"amenities" json:"amenities"`
	Images        []string           `bson:"images" json:"images"`
	Thumbnail     string             `bson:"thumbnail" json:"thumbnail"`
	TotalRooms    int                `bson:"total_rooms" json:"totalRooms"`
	PricePerNight float64            `bson:"price_per_night" json:"pricePerNight"`
	AmadeusID     string             `bson:"amadeus_id" json:"amadeus_id"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

type HotelService struct {
	collection *mongo.Collection
	channel    *amqp.Channel
}

func main() {
	// MongoDB connection
	mongoURL := os.Getenv("MONGO_URL")
	if mongoURL == "" {
		mongoURL = "mongodb://localhost:27017"
	}

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURL))
	if err != nil {
		log.Fatal(err)
	}

	collection := client.Database("hotel_db").Collection("hotels")

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

	// Declare queue
	_, err = ch.QueueDeclare(
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

	service := &HotelService{
		collection: collection,
		channel:    ch,
	}

	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Hotel routes (accessible via /api/hotels from nginx)
	router.GET("/hotels", service.getHotels)
	router.GET("/hotels/:id", service.getHotel)
	router.POST("/hotels", service.createHotel)
	router.PUT("/hotels/:id", service.updateHotel)
	router.DELETE("/hotels/:id", service.deleteHotel)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	log.Printf("Hotel service running on port %s", port)
	router.Run(":" + port)
}

func (s *HotelService) getHotels(c *gin.Context) {
	var hotels []Hotel
	cursor, err := s.collection.Find(context.TODO(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &hotels); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hotels)
}

func (s *HotelService) getHotel(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var hotel Hotel
	err = s.collection.FindOne(context.TODO(), bson.M{"_id": objectID}).Decode(&hotel)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Hotel not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hotel)
}

func (s *HotelService) createHotel(c *gin.Context) {
	var hotel Hotel
	if err := c.ShouldBindJSON(&hotel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hotel.ID = primitive.NewObjectID()
	hotel.CreatedAt = time.Now()
	hotel.UpdatedAt = time.Now()

	// Set default images if not provided
	if len(hotel.Images) == 0 {
		hotel.Images = []string{
			"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
			"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
			"https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800",
		}
	}

	if hotel.Thumbnail == "" {
		hotel.Thumbnail = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
	}

	if len(hotel.Amenities) == 0 {
		hotel.Amenities = []string{"WiFi", "Pool", "Spa", "Gym", "Restaurant"}
	}

	_, err := s.collection.InsertOne(context.TODO(), hotel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publish to RabbitMQ
	s.publishHotelUpdate("created", hotel)

	c.JSON(http.StatusCreated, hotel)
}

func (s *HotelService) updateHotel(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var hotel Hotel
	if err := c.ShouldBindJSON(&hotel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hotel.UpdatedAt = time.Now()

	_, err = s.collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": objectID},
		bson.M{"$set": hotel},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	hotel.ID = objectID
	// Publish to RabbitMQ
	s.publishHotelUpdate("updated", hotel)

	c.JSON(http.StatusOK, hotel)
}

func (s *HotelService) deleteHotel(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	_, err = s.collection.DeleteOne(context.TODO(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publish to RabbitMQ
	hotel := Hotel{ID: objectID}
	s.publishHotelUpdate("deleted", hotel)

	c.JSON(http.StatusOK, gin.H{"message": "Hotel deleted successfully"})
}

func (s *HotelService) publishHotelUpdate(action string, hotel Hotel) {
	message := map[string]interface{}{
		"action": action,
		"hotel":  hotel,
	}

	body, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling hotel update: %v", err)
		return
	}

	err = s.channel.Publish(
		"",
		"hotel_updates",
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
	if err != nil {
		log.Printf("Error publishing hotel update: %v", err)
	}
}
