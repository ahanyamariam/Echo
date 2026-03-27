package analytics

import "errors"

// ErrNotMember is returned when a user tries to access analytics
// for a conversation they are not a member of.
var ErrNotMember = errors.New("not a member of this conversation")
