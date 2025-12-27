package embedfs

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed dist
var embedFS embed.FS

// FS 返回用于 http.FileServer 的文件系统
func FS() http.FileSystem {
	fsys, err := fs.Sub(embedFS, "dist")
	if err != nil {
		panic(err)
	}
	return http.FS(fsys)
}

// Raw 返回原始的 embed.FS 用于直接操作
func Raw() fs.FS {
	fsys, err := fs.Sub(embedFS, "dist")
	if err != nil {
		panic(err)
	}
	return fsys
}
