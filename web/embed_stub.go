//go:build !embed

package web

import "embed"

// Dist is empty unless built with -tags embed
var Dist embed.FS
