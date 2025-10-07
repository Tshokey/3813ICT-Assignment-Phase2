import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"

export interface UploadResponse {
  result: string
  data: {
    filename: string
    size: number
    imageUrl: string
  }
  numberOfImages: number
  message: string
}

@Injectable({
  providedIn: "root",
})
export class UploadService {
  private apiUrl = "https://localhost:3000/api/upload"

  constructor(private http: HttpClient) {}

  uploadProfileImage(file: File, username: string): Observable<UploadResponse> {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("username", username)

    return this.http.post<UploadResponse>(`${this.apiUrl}/profile-image`, formData)
  }

  uploadChatImage(file: File, channelName?: string, caption?: string): Observable<UploadResponse> {
    const formData = new FormData()
    formData.append("image", file)
    if (channelName) {
      formData.append("channelName", channelName)
    }
    if (caption) {
      formData.append("caption", caption)
    }

    return this.http.post<UploadResponse>(`${this.apiUrl}/chat-image`, formData)
  }

  deleteImage(imageUrl: string): Observable<{ result: string; message: string }> {
    return this.http.delete<{ result: string; message: string }>(`${this.apiUrl}/image`, {
      body: { imageUrl },
    })
  }

  getImageUrl(relativePath: string): string {
    if (!relativePath) return ""
    return `https://localhost:3000${relativePath}`
  }
}
