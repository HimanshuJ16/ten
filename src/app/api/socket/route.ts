import { Server } from "socket.io"
import { createServer } from "http"
import { neon } from "@neondatabase/serverless"

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

io.on("connection", (socket) => {
  console.log("A user connected")

  socket.on("joinTrip", (tripId) => {
    socket.join(tripId)
    console.log(`User joined trip: ${tripId}`)
  })

  socket.on("updateLocation", async (data) => {
    try {
      const { tripId, latitude, longitude, altitude, speed, heading } = data

      const sql = neon(process.env.DATABASE_URL!)

      await sql`
        INSERT INTO "GpsLocation" (
          "latitude",
          "longitude",
          "altitude",
          "speed",
          "heading",
          "timestamp",
          "tripId"
        ) VALUES (
          ${latitude},
          ${longitude},
          ${altitude || null},
          ${speed || null},
          ${heading || null},
          NOW(),
          ${tripId}::uuid
        )
      `

      // Broadcast the location update to all clients in the trip room
      io.to(tripId).emit("locationUpdate", data)
    } catch (error) {
      console.error("Error updating GPS location:", error)
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected")
  })
})

const PORT = process.env.SOCKET_PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})

