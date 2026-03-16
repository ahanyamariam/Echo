package profile

import "time"

type Profile struct {
	ID          string     `json:"id"`
	Username    string     `json:"username"`
	Email       string     `json:"email,omitempty"`
	DisplayName *string    `json:"display_name"`
	AvatarURL   *string    `json:"avatar_url"`
	Bio         *string    `json:"bio"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"`
}

type Settings struct {
	UserID           string     `json:"user_id"`
	ShowEmail        bool       `json:"show_email"`
	ShowAvatar       bool       `json:"show_avatar"`
	ShowOnlineStatus bool       `json:"show_online_status"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        *time.Time `json:"updated_at"`
}

type ProfileWithSettings struct {
	Profile  *Profile  `json:"profile"`
	Settings *Settings `json:"settings,omitempty"`
}

// PublicProfile is what other users can see (respects privacy)
type PublicProfile struct {
	ID          string  `json:"id"`
	Username    string  `json:"username"`
	DisplayName *string `json:"display_name"`
	AvatarURL   *string `json:"avatar_url,omitempty"`
	Bio         *string `json:"bio,omitempty"`
}