package main

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret []byte

// 初始化JWT密钥
func init() {
	// 从环境变量获取JWT密钥，如果没有则生成一个
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// 生成随机密钥
		jwtSecret = make([]byte, 32)
		if _, err := rand.Read(jwtSecret); err != nil {
			panic("Failed to generate JWT secret: " + err.Error())
		}
		fmt.Println("Warning: Using generated JWT secret. Set JWT_SECRET environment variable in production.")
	} else {
		jwtSecret = []byte(secret)
	}
}

// AuthService 认证服务
type AuthService struct {
	users map[string]User // 简单的内存存储，生产环境应使用数据库
}

// NewAuthService 创建认证服务
func NewAuthService() *AuthService {
	return &AuthService{
		users: make(map[string]User),
	}
}

// generateToken 生成JWT token
func (as *AuthService) generateToken(user User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24 * 7).Unix(), // 7天过期
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// validateToken 验证JWT token
func (as *AuthService) validateToken(tokenString string) (*jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &claims, nil
	}

	return nil, errors.New("invalid token")
}

// hashPassword 哈希密码
func (as *AuthService) hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// checkPassword 检查密码
func (as *AuthService) checkPassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// Register 用户注册
func (as *AuthService) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, APIResponse{
			Success: false,
			Message: "请求参数无效",
			Error:   err.Error(),
		})
		return
	}

	// 检查用户名是否已存在
	for _, user := range as.users {
		if user.Username == req.Username {
			c.JSON(400, APIResponse{
				Success: false,
				Message: "用户名已存在",
			})
			return
		}
		if user.Email == req.Email {
			c.JSON(400, APIResponse{
				Success: false,
				Message: "邮箱已被使用",
			})
			return
		}
	}

	// 哈希密码
	hashedPassword, err := as.hashPassword(req.Password)
	if err != nil {
		c.JSON(500, APIResponse{
			Success: false,
			Message: "密码加密失败",
			Error:   err.Error(),
		})
		return
	}

	// 创建用户
	user := User{
		ID:       uuid.New().String(),
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
		Created:  time.Now(),
		Updated:  time.Now(),
	}

	as.users[user.ID] = user

	// 生成token
	token, err := as.generateToken(user)
	if err != nil {
		c.JSON(500, APIResponse{
			Success: false,
			Message: "生成token失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(200, APIResponse{
		Success: true,
		Message: "注册成功",
		Data: AuthResponse{
			Token: token,
			User:  user,
		},
	})
}

// Login 用户登录
func (as *AuthService) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, APIResponse{
			Success: false,
			Message: "请求参数无效",
			Error:   err.Error(),
		})
		return
	}

	// 查找用户
	var user User
	var found bool
	for _, u := range as.users {
		if u.Username == req.Username {
			user = u
			found = true
			break
		}
	}

	if !found {
		c.JSON(401, APIResponse{
			Success: false,
			Message: "用户名或密码错误",
		})
		return
	}

	// 验证密码
	if err := as.checkPassword(req.Password, user.Password); err != nil {
		c.JSON(401, APIResponse{
			Success: false,
			Message: "用户名或密码错误",
		})
		return
	}

	// 生成token
	token, err := as.generateToken(user)
	if err != nil {
		c.JSON(500, APIResponse{
			Success: false,
			Message: "生成token失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(200, APIResponse{
		Success: true,
		Message: "登录成功",
		Data: AuthResponse{
			Token: token,
			User:  user,
		},
	})
}

// VerifyToken 验证token
func (as *AuthService) VerifyToken(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, APIResponse{
			Success: false,
			Message: "用户未认证",
		})
		return
	}

	user, exists := as.users[userID.(string)]
	if !exists {
		c.JSON(404, APIResponse{
			Success: false,
			Message: "用户不存在",
		})
		return
	}

	c.JSON(200, APIResponse{
		Success: true,
		Message: "token有效",
		Data: map[string]interface{}{
			"user": user,
		},
	})
}

// AuthMiddleware JWT认证中间件
func (as *AuthService) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, APIResponse{
				Success: false,
				Message: "缺少认证token",
			})
			c.Abort()
			return
		}

		// 提取token（格式: "Bearer <token>"）
		tokenString := ""
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
		} else {
			c.JSON(401, APIResponse{
				Success: false,
				Message: "认证token格式无效",
			})
			c.Abort()
			return
		}

		// 验证token
		claims, err := as.validateToken(tokenString)
		if err != nil {
			c.JSON(401, APIResponse{
				Success: false,
				Message: "认证token无效",
				Error:   err.Error(),
			})
			c.Abort()
			return
		}

		// 设置用户信息到上下文
		c.Set("user_id", (*claims)["user_id"])
		c.Set("username", (*claims)["username"])
		c.Next()
	}
}

// saveUsers 保存用户数据到文件（简单持久化）
func (as *AuthService) saveUsers() error {
	file, err := os.Create("users.json")
	if err != nil {
		return err
	}
	defer file.Close()

	return json.NewEncoder(file).Encode(as.users)
}

// loadUsers 从文件加载用户数据
func (as *AuthService) loadUsers() error {
	file, err := os.Open("users.json")
	if err != nil {
		if os.IsNotExist(err) {
			return nil // 文件不存在，忽略
		}
		return err
	}
	defer file.Close()

	return json.NewDecoder(file).Decode(&as.users)
}
