const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// Set global options for all functions (optional)
setGlobalOptions({ maxInstances: 10 });

/**
 * Cloud Function: onCircleJoinRequest (v2)
 * 
 * Triggered when a new document is created in the `circleMembers` collection.
 */
exports.onCircleJoinRequestV2 = onDocumentCreated("circleMembers/{docId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return null;
    }

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
                title: "🔔 Request to Join",
                body: `${requesterName} wants to join "${circleName}"`,
            },
            data: {
                type: "circle_join_request",
                circleId: memberData.circleId,
                requesterId: memberData.userId,
            },
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    channelId: "ajr_alerts_v4",
                    priority: "high",
                },
            },
            apns: {
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
