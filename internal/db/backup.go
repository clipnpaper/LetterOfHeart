package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const backupDir = "data/backups"

func StartAutoBackup(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)

	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := BackupNow(); err != nil {
					log.Printf("warning: automatic database backup failed: %v", err)
				}
			}
		}
	}()
}

func BackupNow() error {
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return fmt.Errorf("create backup directory: %w", err)
	}

	// Flush WAL pages to keep the snapshot as up-to-date as possible.
	if _, err := DB.Exec(`PRAGMA wal_checkpoint(FULL);`); err != nil {
		return fmt.Errorf("checkpoint wal: %w", err)
	}

	backupPath := filepath.Join(backupDir, "letterofheart-"+time.Now().Format("20060102-150405")+".db")
	escapedPath := strings.ReplaceAll(backupPath, "'", "''")
	if _, err := DB.Exec(fmt.Sprintf("VACUUM INTO '%s';", escapedPath)); err != nil {
		return fmt.Errorf("create sqlite snapshot: %w", err)
	}

	return nil
}
