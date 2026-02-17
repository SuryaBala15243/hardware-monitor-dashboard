#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> // Make sure to install ArduinoJson library via Library Manager

// REF: Project Config
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

WebServer server(80);

// Sensor PIN Definitions (Adjust as needed)
#define GAS_PIN 34
#define WATER_PIN 35
// #define UV_PIN 32 // Removed
#define TRIG_PIN 5  // Ultrasonic Trigger
#define ECHO_PIN 18 // Ultrasonic Echo

void setup() {
  Serial.begin(115200);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Define API Endpoint
  server.on("/data", HTTP_GET, []() {
    // 1. Read Sensors
    int gasValue = analogRead(GAS_PIN);
    int waterValue = analogRead(WATER_PIN);
    
    // Read Ultrasonic
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    long duration = pulseIn(ECHO_PIN, HIGH);
    long distance = duration * 0.034 / 2;

    // 2. Create JSON Object
    StaticJsonDocument<200> doc;
    doc["gas"] = gasValue;
    doc["water"] = waterValue;
    doc["distance"] = distance; // "distance" key

    // 3. Serialize to String
    String jsonString;
    serializeJson(doc, jsonString);

    // 4. Send Response
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", jsonString);
  });

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}
