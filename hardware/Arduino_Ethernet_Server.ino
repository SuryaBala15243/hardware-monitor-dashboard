#include <SPI.h>
#include <Ethernet.h>
#include <ArduinoJson.h> // Install via Library Manager

// REF: Network Settings
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192, 168, 1, 177); // <--- Set a free IP on your network

EthernetServer server(80);

// Sensor PIN Definitions
#define GAS_PIN A0
#define WATER_PIN A1
// #define UV_PIN A2 // Removed
#define TRIG_PIN 8  // Ultrasonic Trigger
#define ECHO_PIN 9  // Ultrasonic Echo

void setup() {
  Serial.begin(9600);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Try to get an IP address using DHCP
  Serial.println("Attempting to get IP via DHCP...");
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Failed to configure Ethernet using DHCP, falling back to static IP.");
    // initialize the Ethernet device not using DHCP:
    Ethernet.begin(mac, ip);
  }
  
  server.begin();
  
  Serial.print("Server is at ");
  Serial.println(Ethernet.localIP());
}

// Function to get stable distance (Median Filter)
long getMedianDistance() {
  long values[5]; // Array to store 5 readings
  
  // 1. Take 5 readings
  for (int i = 0; i < 5; i++) {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    
    long duration = pulseIn(ECHO_PIN, HIGH);
    values[i] = duration * 0.034 / 2;
    delay(15); // Small delay to let echo settle
  }

  // 2. Sort them (Simple Bubble Sort)
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4 - i; j++) {
      if (values[j] > values[j + 1]) {
        long temp = values[j];
        values[j] = values[j + 1];
        values[j + 1] = temp;
      }
    }
  }

  // 3. Return the middle value (Median)
  return values[2];
}

void loop() {
  EthernetClient client = server.available();
  if (client) {
    boolean currentLineIsBlank = true;
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        
        // Detect end of request header
        if (c == '\n' && currentLineIsBlank) {
          // Read Sensors
          int gasValue = analogRead(GAS_PIN);
          int waterValue = analogRead(WATER_PIN); 
          int waterPercent = map(waterValue, 0, 1023, 0, 100);
          
          // Read Ultrasonic (Stable)
          long distance = getMedianDistance();

          // Create JSON
          StaticJsonDocument<200> doc;
          doc["gas"] = gasValue;
          doc["water"] = waterPercent;
          doc["distance"] = distance; // "distance" key matches App.jsx

          String jsonString;
          serializeJson(doc, jsonString);

          // Send Standard HTTP Response
          client.println("HTTP/1.1 200 OK");
          client.println("Content-Type: application/json");
          client.println("Access-Control-Allow-Origin: *");
          client.println("Connection: close");
          client.println();
          client.print(jsonString);
          break;
        }
        
        if (c == '\n') {
          currentLineIsBlank = true;
        } else if (c != '\r') {
          currentLineIsBlank = false;
        }
      }
    }
    delay(1);
    client.stop();
  }
}
