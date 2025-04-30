import { Text, View, TextInput, Button, Switch, Alert, Platform } from "react-native";
import { useState, useEffect, useRef } from "react";
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { Canon } from "../lib/Canon";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const expo = SQLite.openDatabaseSync('db.db');
const db = drizzle(expo);

import NetInfo from "@react-native-community/netinfo";

const DEFAULT_IP = "10.0.0.241"
const DEFAULT_PORT = "8080"

export default function Index() {
  const [ipAddress, setIpAddress] = useState(DEFAULT_IP);
  const [port, setPort] = useState(DEFAULT_PORT);
  const [isHttps, setIsHttps] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentIp, setCurrentIp] = useState("");
  const [syncFrequency, setSyncFrequency] = useState("10");
  const canonRef = useRef<Canon | null>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [downloadedImagesCount, setDownloadedImagesCount] = useState(0);

  useEffect(() => {
    // Get current IP address when component mounts
    getLocalIpAddress();
    // Request media library permissions
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required", 
          "To save images to your device's photo library, you need to grant media library permissions."
        );
      }
    })();
  }, []);

  const getLocalIpAddress = async () => {
    try {
      const state = await NetInfo.fetch();
      if (state.type === "wifi" && state.details && state.details.ipAddress) {
        setCurrentIp(state.details.ipAddress);
        console.log("Current IP address:", state.details.ipAddress);
      } else {
        console.log("Could not get IP address or not connected to WiFi");
        setCurrentIp("Unknown");
      }
    } catch (error) {
      console.error("Error getting network info:", error);
      setCurrentIp("Unknown");
    }
  };

  // Callback function to save images to the phone
  const saveImagesToPhone = async (images: Blob[]) => {
    if (!images || images.length === 0) {
      console.log("No new images to save.");
      return;
    }
    console.log(`Received ${images.length} new images to save.`);

    // Check for media library permissions
    if (!hasMediaPermission) {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied", 
          "Cannot save images to your device without media library permissions."
        );
        return;
      }
    }

    let successCount = 0;
    const promises = images.map(async (blob, index) => {
      try {
        // Read the blob as a base64 data URL
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(blob);
        });

        // Extract base64 content (remove data:mime/type;base64,)
        const base64String = base64Data.split(',')[1];

        if (!base64String) {
            throw new Error("Failed to extract base64 string from blob.");
        }

        // Define a unique filename
        const filename = `canon_image_${Date.now()}_${index}.jpg`; // Assuming JPEG
        
        // First save to app's cache directory
        const tempFileUri = FileSystem.cacheDirectory + filename;
        
        console.log(`Saving image temporarily to: ${tempFileUri}`);

        // Write the file to cache
        await FileSystem.writeAsStringAsync(tempFileUri, base64String, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(tempFileUri);
        console.log(`Successfully saved to media library: ${asset.uri}`);
        
        // Create a Canon Images album if it doesn't exist
        const albums = await MediaLibrary.getAlbumsAsync();
        let canonAlbum = albums.find((a: any) => a.title === 'Canon Images');
        
        if (!canonAlbum) {
          canonAlbum = await MediaLibrary.createAlbumAsync('Canon Images', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], canonAlbum, false);
        }
        
        // Clean up the temp file
        await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
        
        // Increment success counter
        successCount++;
        
        // Alert.alert("Success", `Saved image ${index + 1} to your photo library in the 'Canon Images' album`);
      } catch (error) {
        console.error("Error saving image:", error);
        Alert.alert("Save Error", `Failed to save image ${index + 1}.`);
      }
    });

    await Promise.all(promises);
    
    // Update total downloaded count
    setDownloadedImagesCount(prev => prev + successCount);
    
    Alert.alert("Sync Complete", `${successCount} new image(s) saved successfully to your photo library.`);
  };

  const handleConnect = async () => {
    if (!ipAddress || !port || !syncFrequency) {
      Alert.alert("Error", "Please enter IP address, port, and sync frequency");
      return;
    }

    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber)) {
      Alert.alert("Error", "Please enter a valid port number");
      return;
    }

    const frequencySeconds = parseInt(syncFrequency, 10);
    if (isNaN(frequencySeconds) || frequencySeconds <= 0) {
      Alert.alert("Error", "Please enter a valid positive number for sync frequency");
      return;
    }

    setIsLoading(true);
    
    try {
      // Instantiate the Canon class
      // Note: Username and password are not handled yet, assuming they are optional
      const canon = new Canon(ipAddress, portNumber, isHttps); 
      canonRef.current = canon;
      
      console.log(`Attempting to connect to Canon camera at ${ipAddress}:${portNumber} using ${isHttps ? 'HTTPS' : 'HTTP'}...`);
      
      // Connect to the camera
      const connected = await canon.connect();
      if (!connected) {
        throw new Error("Failed to connect to the camera");
      }
      
      setIsConnected(true);
      console.log("Connection successful. Starting sync...");
      Alert.alert("Success", `Connected successfully to ${canon.modelName}`);

      // Start syncing every N seconds, passing the save function as a callback
        async function callback() {
          const eventPolling = await canon.getEventPolling();
          console.log(eventPolling);
      }

      await canon.sync(callback, frequencySeconds);

    } catch (error: any) {
      console.error("Connection or sync failed:", error);
      Alert.alert("Connection Failed", error.message || "Could not connect or sync with the camera");
    } finally {
      // Reset states when connection ends (either completed or failed)
      setIsLoading(false);
      setIsConnected(false);
      canonRef.current = null;
    }
  };

  const handleCancel = () => {
    if (canonRef.current) {
      console.log("Canceling connection/sync process...");
      canonRef.current.cancelSync();
      canonRef.current = null;
      setIsLoading(false);
      setIsConnected(false);
      Alert.alert("Cancelled", "Connection process has been cancelled");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <View style={{ width: "100%", marginBottom: 20 }}>
        <Text style={{ marginBottom: 5 }}>IP Address</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 5,
            width: "100%",
          }}
          value={ipAddress}
          onChangeText={setIpAddress}
          placeholder="Enter IP address"
        />
      </View>

      <View style={{ width: "100%", marginBottom: 20 }}>
        <Text style={{ marginBottom: 5 }}>Port</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 5,
            width: "100%",
          }}
          value={port}
          onChangeText={setPort}
          placeholder="Enter port"
          keyboardType="number-pad"
        />
      </View>

      <View 
        style={{ 
          width: "100%", 
          marginBottom: 20, 
          flexDirection: "row", 
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Text>HTTPS</Text>
        <Switch
          value={isHttps}
          onValueChange={setIsHttps}
        />
      </View>

      <View style={{ width: "100%", marginBottom: 20 }}>
        <Text style={{ marginBottom: 5 }}>Sync Frequency (seconds)</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 5,
            width: "100%",
          }}
          value={syncFrequency}
          onChangeText={setSyncFrequency}
          placeholder="Enter sync frequency in seconds"
          keyboardType="number-pad"
        />
      </View>

      {downloadedImagesCount > 0 && (
        <View style={{ width: "100%", marginBottom: 20 }}>
          <Text style={{ textAlign: "center", fontWeight: "bold" }}>
            Downloaded Images: {downloadedImagesCount}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%" }}>
        { !isConnected && (
          <Button
            title={isLoading ? "Connecting..." : "Connect"}
            onPress={handleConnect}
            disabled={isLoading || isConnected}
          />
        )}
        
        {isConnected && (
          <Button
            title="Cancel"
            onPress={handleCancel}
            color="red"
          />
        )}
      </View>
    </View>
  );
}
