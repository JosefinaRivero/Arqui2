package main

import (
	"bytes"
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/bradfitz/gomemcache/memcache"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v4"
)

type User struct {
	ID        int       `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"password,omitempty" db:"password"`
	IsAdmin   bool      `json:"is_admin" db:"is_admin"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Reservation struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	HotelID   string    `json:"hotel_id" db:"hotel_id"`
	CheckIn   time.Time `json:"check_in" db:"check_in"`
	CheckOut  time.Time `json:"check_out" db:"check_out"`
	Status    string    `json:"status" db:"status"`
	AmadeusID string    `json:"amadeus_id" db:"amadeus_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type UserService struct {
	db              *sql.DB
	memcached       *memcache.Client
	amadeusClientID string
	amadeusSecret   string
	jwtSecret       string
}

type AmadeusToken struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

type Claims struct {
	UserID  int  `json:"user_id"`
	IsAdmin bool `json:"is_admin"`
	jwt.RegisteredClaims
}

func main() {
	// Database connection
	mysqlURL := os.Getenv("MYSQL_URL")
	if mysqlURL == "" {
		mysqlURL = "user:password@tcp(localhost:3306)/hotel_db"
	}

	db, err := sql.Open("mysql", mysqlURL+"?parseTime=true")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Memcached connection
	memcachedURL := os.Getenv("MEMCACHED_URL")
	if memcachedURL == "" {
		memcachedURL = "localhost:11211"
	}
	mc := memcache.New(memcachedURL)

	service := &UserService{
		db:              db,
		memcached:       mc,
		amadeusClientID: os.Getenv("AMADEUS_CLIENT_ID"),
		amadeusSecret:   os.Getenv("AMADEUS_CLIENT_SECRET"),
		jwtSecret:       os.Getenv("JWT_SECRET"),
	}

	// Initialize database tables
	service.initDB()

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

	// Auth routes (accessible via /api/auth from nginx)
	router.POST("/auth/register", service.register)
	router.POST("/auth/login", service.login)

	// User routes (accessible via /api/users from nginx)
	router.GET("/users", service.authMiddleware(), service.getUsers)
	router.GET("/users/:id", service.authMiddleware(), service.getUser)
	router.GET("/users/:id/reservations", service.authMiddleware(), service.getUserReservations)

	// Reservation routes (accessible via /api/reservations from nginx)
	router.POST("/reservations", service.authMiddleware(), service.createReservation)
	router.GET("/reservations", service.authMiddleware(), service.getReservations)

	// Availability route (accessible via /api/availability from nginx)
	router.GET("/availability", service.checkAvailability)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}

	log.Printf("User service running on port %s", port)
	router.Run(":" + port)
}

func (s *UserService) initDB() {
	// Create users table
	userTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(50) UNIQUE NOT NULL,
		email VARCHAR(100) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		is_admin BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	// Create reservations table
	reservationTable := `
	CREATE TABLE IF NOT EXISTS reservations (
		id INT AUTO_INCREMENT PRIMARY KEY,
		user_id INT NOT NULL,
		hotel_id VARCHAR(50) NOT NULL,
		check_in DATE NOT NULL,
		check_out DATE NOT NULL,
		status VARCHAR(20) DEFAULT 'pending',
		amadeus_id VARCHAR(100),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	)`

	// Create hotel_mapping table for Amadeus ID mapping
	mappingTable := `
	CREATE TABLE IF NOT EXISTS hotel_mapping (
		internal_id VARCHAR(50) PRIMARY KEY,
		amadeus_id VARCHAR(100) NOT NULL
	)`

	if _, err := s.db.Exec(userTable); err != nil {
		log.Fatal(err)
	}

	if _, err := s.db.Exec(reservationTable); err != nil {
		log.Fatal(err)
	}

	if _, err := s.db.Exec(mappingTable); err != nil {
		log.Fatal(err)
	}

	// Create admin user if not exists
	s.createAdminUser()
}

func (s *UserService) createAdminUser() {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users WHERE is_admin = TRUE").Scan(&count)
	if err != nil {
		log.Printf("Error checking admin users: %v", err)
		return
	}

	if count == 0 {
		hashedPassword := fmt.Sprintf("%x", md5.Sum([]byte("admin123")))
		_, err := s.db.Exec(
			"INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)",
			"admin", "admin@hotel.com", hashedPassword, true,
		)
		if err != nil {
			log.Printf("Error creating admin user: %v", err)
		} else {
			log.Println("Admin user created: username=admin, password=admin123")
		}
	}
}

func (s *UserService) register(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword := fmt.Sprintf("%x", md5.Sum([]byte(user.Password)))

	result, err := s.db.Exec(
		"INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)",
		user.Username, user.Email, hashedPassword, false,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username or email already exists"})
		return
	}

	userID, _ := result.LastInsertId()
	user.ID = int(userID)
	user.Password = ""

	c.JSON(http.StatusCreated, user)
}

func (s *UserService) login(c *gin.Context) {
	var credentials struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword := fmt.Sprintf("%x", md5.Sum([]byte(credentials.Password)))

	var user User
	err := s.db.QueryRow(
		"SELECT id, username, email, is_admin FROM users WHERE username = ? AND password = ?",
		credentials.Username, hashedPassword,
	).Scan(&user.ID, &user.Username, &user.Email, &user.IsAdmin)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Create JWT token
	claims := Claims{
		UserID:  user.ID,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  user,
	})
}

func (s *UserService) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(s.jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("is_admin", claims.IsAdmin)
		c.Next()
	}
}

func (s *UserService) getUsers(c *gin.Context) {
	isAdmin, _ := c.Get("is_admin")
	if !isAdmin.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	rows, err := s.db.Query("SELECT id, username, email, is_admin, created_at FROM users")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.IsAdmin, &user.CreatedAt)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

func (s *UserService) getUser(c *gin.Context) {
	userID := c.Param("id")
	var user User
	err := s.db.QueryRow(
		"SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Username, &user.Email, &user.IsAdmin, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (s *UserService) checkAvailability(c *gin.Context) {
	hotelID := c.Query("hotel_id")
	checkIn := c.Query("check_in")
	checkOut := c.Query("check_out")

	if hotelID == "" || checkIn == "" || checkOut == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	// Create cache key
	cacheKey := fmt.Sprintf("availability_%s_%s_%s", hotelID, checkIn, checkOut)

	// Check cache first
	item, err := s.memcached.Get(cacheKey)
	if err == nil {
		var result map[string]interface{}
		json.Unmarshal(item.Value, &result)
		c.JSON(http.StatusOK, result)
		return
	}

	// Check database for existing reservations
	var count int
	err = s.db.QueryRow(
		"SELECT COUNT(*) FROM reservations WHERE hotel_id = ? AND status = 'confirmed' AND ((check_in <= ? AND check_out > ?) OR (check_in < ? AND check_out >= ?))",
		hotelID, checkIn, checkIn, checkOut, checkOut,
	).Scan(&count)

	available := count == 0
	result := map[string]interface{}{
		"available": available,
		"hotel_id":  hotelID,
		"check_in":  checkIn,
		"check_out": checkOut,
	}

	// Cache result for 10 seconds
	resultJSON, _ := json.Marshal(result)
	s.memcached.Set(&memcache.Item{
		Key:        cacheKey,
		Value:      resultJSON,
		Expiration: 10,
	})

	c.JSON(http.StatusOK, result)
}

func (s *UserService) createReservation(c *gin.Context) {
	var reservation Reservation
	if err := c.ShouldBindJSON(&reservation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	reservation.UserID = userID.(int)

	// Validate with Amadeus
	if s.amadeusClientID != "" && s.amadeusSecret != "" {
		valid, amadeusID := s.validateWithAmadeus(reservation.HotelID, reservation.CheckIn, reservation.CheckOut)
		if !valid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Reservation not available"})
			return
		}
		reservation.AmadeusID = amadeusID
		reservation.Status = "confirmed"
	} else {
		reservation.Status = "pending"
	}

	result, err := s.db.Exec(
		"INSERT INTO reservations (user_id, hotel_id, check_in, check_out, status, amadeus_id) VALUES (?, ?, ?, ?, ?, ?)",
		reservation.UserID, reservation.HotelID, reservation.CheckIn, reservation.CheckOut, reservation.Status, reservation.AmadeusID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	reservationID, _ := result.LastInsertId()
	reservation.ID = int(reservationID)

	c.JSON(http.StatusCreated, reservation)
}

func (s *UserService) getReservations(c *gin.Context) {
	isAdmin, _ := c.Get("is_admin")
	if !isAdmin.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	rows, err := s.db.Query("SELECT id, user_id, hotel_id, check_in, check_out, status, amadeus_id, created_at FROM reservations")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var reservations []Reservation
	for rows.Next() {
		var reservation Reservation
		err := rows.Scan(&reservation.ID, &reservation.UserID, &reservation.HotelID, &reservation.CheckIn, &reservation.CheckOut, &reservation.Status, &reservation.AmadeusID, &reservation.CreatedAt)
		if err != nil {
			continue
		}
		reservations = append(reservations, reservation)
	}

	c.JSON(http.StatusOK, reservations)
}

func (s *UserService) getUserReservations(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if user is accessing their own reservations or is admin
	currentUserID, _ := c.Get("user_id")
	isAdmin, _ := c.Get("is_admin")

	if currentUserID.(int) != userID && !isAdmin.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	rows, err := s.db.Query(
		"SELECT id, user_id, hotel_id, check_in, check_out, status, amadeus_id, created_at FROM reservations WHERE user_id = ?",
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var reservations []Reservation
	for rows.Next() {
		var reservation Reservation
		err := rows.Scan(&reservation.ID, &reservation.UserID, &reservation.HotelID, &reservation.CheckIn, &reservation.CheckOut, &reservation.Status, &reservation.AmadeusID, &reservation.CreatedAt)
		if err != nil {
			continue
		}
		reservations = append(reservations, reservation)
	}

	c.JSON(http.StatusOK, reservations)
}

func (s *UserService) getAmadeusToken() (string, error) {
	data := fmt.Sprintf("grant_type=client_credentials&client_id=%s&client_secret=%s", s.amadeusClientID, s.amadeusSecret)

	resp, err := http.Post("https://test.api.amadeus.com/v1/security/oauth2/token",
		"application/x-www-form-urlencoded",
		bytes.NewBufferString(data))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var token AmadeusToken
	if err := json.Unmarshal(body, &token); err != nil {
		return "", err
	}

	return token.AccessToken, nil
}

func (s *UserService) validateWithAmadeus(hotelID string, checkIn, checkOut time.Time) (bool, string) {
	// Get Amadeus token
	token, err := s.getAmadeusToken()
	if err != nil {
		log.Printf("Error getting Amadeus token: %v", err)
		return false, ""
	}

	// Get Amadeus hotel ID mapping
	var amadeusID string
	err = s.db.QueryRow("SELECT amadeus_id FROM hotel_mapping WHERE internal_id = ?", hotelID).Scan(&amadeusID)
	if err != nil {
		// If no mapping exists, create a dummy one for testing
		amadeusID = "YXPARKPR" // Sample Amadeus hotel ID
		s.db.Exec("INSERT INTO hotel_mapping (internal_id, amadeus_id) VALUES (?, ?)", hotelID, amadeusID)
	}

	// Check availability with Amadeus
	url := fmt.Sprintf("https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=%s&checkInDate=%s&checkOutDate=%s",
		amadeusID, checkIn.Format("2006-01-02"), checkOut.Format("2006-01-02"))

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, ""
	}

	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, ""
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		// For simplicity, assume availability if we get a successful response
		return true, amadeusID
	}

	return false, ""
}
