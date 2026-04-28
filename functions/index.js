const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function: onCircleJoinRequest (v1)
 * 
 * Triggered when a new document is created in the `circleMembers` collection.
 * If the new member has status='pending', sends a push notification to the circle creator
 * using Firebase Cloud Messaging (FCM) directly.
 */
exports.onCircleJoinRequest = functions.firestore
    .document("circleMembers/{docId}")
    .onCreate(async (snapshot, context) => {
        const memberData = snapshot.data();

        // Only process pending join requests
        if (memberData.status !== "pending") {
            console.log("Not a pending request, skipping");
            return null;
        }

        const db = admin.firestore();
        const messaging = admin.messaging();

        try {
            // 1. Get circle details
            const circleDoc = await db.collection("circles").doc(memberData.circleId).get();
            if (!circleDoc.exists) {
                console.log("Circle not found:", memberData.circleId);
                return null;
            }

            const circleData = circleDoc.data();
            const creatorId = circleData.createdBy;
            const circleName = circleData.name || "your circle";

            // 2. Get requester name
            const requesterName = memberData.requesterName || "Someone";

            // 3. Get creator's FCM token from Firestore
            const creatorDoc = await db.collection("users").doc(creatorId).get();
            if (!creatorDoc.exists) {
                console.log("Creator not found:", creatorId);
                return null;
            }

            const creatorData = creatorDoc.data();
            const fcmToken = creatorData.fcmToken;

            if (!fcmToken) {
                console.log("Creator has no FCM token:", creatorId);
                return null;
            }

            console.log("Sending FCM notification to creator:", creatorId);

            // 4. Send via Firebase Admin SDK
            const message = {
                token: fcmToken,
                notification: {
                    title: "🔔 New Join Request",
                    body: `${requesterName} wants to join "${circleName}"`,
                },
                data: {
                    type: "circle_join_request",
                    circleId: memberData.circleId,
                    requesterId: memberData.userId,
                },
                ios: {
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
            };

            const response = await messaging.send(message);
            console.log("Successfully sent message:", response);
            return response;
        } catch (error) {
            console.error("Error sending notification:", error);
            return null;
        }
    });
