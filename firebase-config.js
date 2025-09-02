// Firebase Configuration
// This file contains the Firebase configuration and initialization

// Firebase configuration object (replace with your actual config)
const firebaseConfig = {
    // You'll need to replace these values with your actual Firebase project config

  apiKey: "AIzaSyBbnT4SgiMNHo2emzmQ2Asab2nkNgolGR4",
  authDomain: "calendar-9dfee.firebaseapp.com",
  projectId: "calendar-9dfee",
  storageBucket: "calendar-9dfee.firebasestorage.app",
  messagingSenderId: "105140103549",
  appId: "1:105140103549:web:3ab83090486cef7343c414"
};

// Firebase service class
class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
        this.initialized = false;
    }

    // Initialize Firebase
    init() {
        try {
            if (typeof firebase !== 'undefined') {
                this.app = firebase.initializeApp(firebaseConfig);
                this.db = firebase.firestore();
                this.initialized = true;
                console.log('Firebase initialized successfully');
            } else {
                console.warn('Firebase SDK not loaded. Using local storage fallback.');
                this.initialized = false;
            }
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.initialized = false;
        }
    }

    // Check if Firebase is initialized
    isInitialized() {
        return this.initialized;
    }

    // Save event to Firestore
    async saveEvent(event) {
        if (!this.initialized) {
            console.warn('Firebase not initialized. Saving to local storage only.');
            return null;
        }

        try {
            const docRef = await this.db.collection('events').add(event);
            console.log('Event saved to Firebase with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving event to Firebase:', error);
            throw error;
        }
    }

    // Load all events from Firestore
    async loadEvents() {
        if (!this.initialized) {
            console.warn('Firebase not initialized. Loading from local storage only.');
            return [];
        }

        try {
            const snapshot = await this.db.collection('events').get();
            const events = [];
            snapshot.forEach(doc => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            console.log('Loaded', events.length, 'events from Firebase');
            return events;
        } catch (error) {
            console.error('Error loading events from Firebase:', error);
            throw error;
        }
    }

    // Update event in Firestore
    async updateEvent(eventId, eventData) {
        if (!this.initialized) {
            console.warn('Firebase not initialized. Cannot update event.');
            return;
        }

        try {
            await this.db.collection('events').doc(eventId).update(eventData);
            console.log('Event updated in Firebase:', eventId);
        } catch (error) {
            console.error('Error updating event in Firebase:', error);
            throw error;
        }
    }

    // Delete event from Firestore
    async deleteEvent(eventId) {
        if (!this.initialized) {
            console.warn('Firebase not initialized. Cannot delete event.');
            return;
        }

        try {
            await this.db.collection('events').doc(eventId).delete();
            console.log('Event deleted from Firebase:', eventId);
        } catch (error) {
            console.error('Error deleting event from Firebase:', error);
            throw error;
        }
    }

    // Listen for real-time updates
    onEventsChange(callback) {
        if (!this.initialized) {
            console.warn('Firebase not initialized. Real-time updates not available.');
            return null;
        }

        try {
            return this.db.collection('events').onSnapshot(snapshot => {
                const events = [];
                snapshot.forEach(doc => {
                    events.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(events);
            });
        } catch (error) {
            console.error('Error setting up real-time listener:', error);
            return null;
        }
    }
}

// Export Firebase service instance
const firebaseService = new FirebaseService();

// Instructions for setup (displayed in console)
console.log(`
=== Firebase Setup Instructions ===
1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Enable Firestore Database
4. Get your config from Project Settings > General > Your apps
5. Replace the firebaseConfig object above with your actual config
6. Update the HTML to include your Firebase project's CDN links if needed
=====================================
`);

// Initialize Firebase when script loads
document.addEventListener('DOMContentLoaded', () => {
    firebaseService.init();
});