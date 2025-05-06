#include "esp_camera.h"
#include <WiFi.h>
#include "src/Audio.h"
#include <driver/i2s.h>
#include "esp_http_server.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "config.h"


#define CAMERA_MODEL_AI_THINKER // Has PSRAM
camera_config_t config;
#define DECODE_NEC

#define I2S_DOUT      14
#define I2S_BCLK      13
#define I2S_LRC       12
bool httpServerRunning = false;
bool isRunning = false;
bool shouldContinue = false;


extern httpd_handle_t camera_httpd;
extern httpd_handle_t stream_httpd;
#include "camera_pins.h"
#include "PinDefinitionsAndMore.h"
#include <IRremote.hpp> // include the library
Audio* audio = nullptr;

// Replace the next variables with your SSID/Password combination


httpd_handle_t startCameraServer();
void setupLedFlash(int pin);


void startCamera() {
  if (!httpServerRunning) {
    startCameraServer();  // Don't assign to `server` — we now use global handles
    httpServerRunning = true;
  }
}

void stopCamera() {
  if (camera_httpd) {
    httpd_stop(camera_httpd);
    camera_httpd = NULL;
  }
  if (stream_httpd) {
    httpd_stop(stream_httpd);
    stream_httpd = NULL;
  }
  httpServerRunning = false;
}

void deinit_camera() {
  // Stop camera stream
  esp_camera_deinit();
  delay(100);
  // Optional: power down the camera if you use PWDN pin
  // digitalWrite(PWDN_GPIO_NUM, HIGH);  // Only if used
}
void init_camera() {
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
  } else {
    Serial.println("Camera initialized.");
  }
  sensor_t * s = esp_camera_sensor_get();
  s->set_brightness(s, 0);
}
void deinit_audio() {
  if (audio){
    delete audio;        // 💡 Add this
    audio = nullptr;
  }
  delay(500);
}

void init_audio(){
  audio = new Audio();   // <== This was missing!
  delay(100);
  audio->setPinout(I2S_BCLK, I2S_LRC, I2S_DOUT);
  audio->setVolume(30);
}


void switch_to_camera_mode() {
  deinit_audio();      // Free up RAM
  delay(100);
  init_camera();       // Your existing esp_camera_init(&config);
}

void switch_to_audio_mode() {
  deinit_camera();
  httpServerRunning = false;
  stopCamera();
  delay(100);
  init_audio();
  delay(200);      // Your existing i2s_driver_install() logic
}


void setup() {
  Serial.begin(115200);

  // Set up camera config
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size = FRAMESIZE_QVGA;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_DRAM;  // Use internal RAM
  config.jpeg_quality = 15;
  config.fb_count = 1;

  if (config.pixel_format == PIXFORMAT_JPEG) {
    if (psramFound()) {
      config.jpeg_quality = 10;
      config.fb_count = 2;
      config.grab_mode = CAMERA_GRAB_LATEST;
      config.fb_location = CAMERA_FB_IN_PSRAM;
    } else {
      config.frame_size = FRAMESIZE_QQVGA;
      config.fb_location = CAMERA_FB_IN_DRAM;
    }
  }


  WiFi.begin(ssid, password);
  WiFi.setSleep(false);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  
  // Start in AUDIO mode

  Serial.print("System Ready! IP: http://");
  Serial.println(WiFi.localIP());

  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);

  printActiveIRProtocols(&Serial);

#if defined(LED_GPIO_NUM)
  setupLedFlash(LED_GPIO_NUM);
#endif

}

void loop() {
  if (IrReceiver.decode()){
    IrReceiver.resume();
    if (IrReceiver.decodedIRData.command == 0x44) {
        isRunning = true;
        if (audio){
          Serial.println("You didnt wipe the audio!");
          deinit_audio();
        }
        init_audio();
        delay(500);
        Serial.println("Scan button pressed!");
        
        // Say "Scanning"
        if (audio){
          audio->connecttospeech("Scanning", "en");
          while (audio && audio->isRunning()) {
            audio->loop();
            delay(1000);
          }
        }
        

        // Switch to camera
        switch_to_camera_mode();
        delay(1000);

        // Start server
        
        startCamera();
        delay(3000);

        HTTPClient http;
        http.begin("http://10.0.0.116:5000/trigger-detection");
        http.addHeader("Content-Type", "application/json");
        
        int httpResponseCode = http.POST("");
        if (httpResponseCode>0){
          String response=http.getString();
          Serial.println("Response: " + response);

          DynamicJsonDocument doc(150);
          deserializeJson(doc, response);

          JsonArray detectedItems = doc["detecteditems"];
          for (JsonVariant item : detectedItems) {
            Serial.println("Detected: " + item.as<String>());
          }
        }
        else{
          Serial.print("Error on sending POST: ");
          Serial.println(httpResponseCode);
        }
        delay(10000);
        http.end();
        // Optional: stay in camera mode until reboot or button press
        // If you want to go back to audio mode after some time:

        deinit_camera();
        delay(100);
        isRunning = false;  // ✅ Allow future presses
        Serial.println("Ready to go again");
        delay(100);
      }
  
  

    if (IrReceiver.decodedIRData.command == 0x46){
      init_audio();
      delay(500);
      Serial.println("Laundry button pressed!");
      
      // Say "Scanning"
      if (audio){
        audio->connecttospeech("Your laundry list is", "en");
        while (audio && audio->isRunning()) {
          audio->loop();
          delay(100);
        }
      }
      deinit_audio();

      HTTPClient http;
      http.begin(laundryUrl);
      http.addHeader("Content-Type", "application/json");
      
      int httpResponseCode = http.GET();
      if (httpResponseCode>0){
        String response=http.getString();
        Serial.println("Response: " + response);

        DynamicJsonDocument doc(300);
        deserializeJson(doc, response);
      
        init_audio();
        delay(500);

        JsonArray clothesArray = doc.as<JsonArray>();     
        for (JsonVariant item : clothesArray) {
          String itemString = item["name"].as<String>();
          if (audio){
            audio->connecttospeech(itemString.c_str(), "en");
            while (audio && audio->isRunning()) {
              audio->loop();
              delay(100);
            }
          }
        }
        deinit_audio();
      }
      else{
        Serial.print("Error on sending POST: ");
        Serial.println(httpResponseCode);
      }
      delay(10000);
      http.end();

    }
  }
  delay(1000);
}