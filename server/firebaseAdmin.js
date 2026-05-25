import admin from "firebase-admin";
import { createRequire } from "module";


console.log("ENV CHECK:", {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKeyExists: !!process.env.FIREBASE_PRIVATE_KEY,
  nodeEnv: process.env.NODE_ENV,
});

// if (!admin.apps.length) {
//   //  Use JSON file locally, env variables in production
//   if (process.env.NODE_ENV === "production") {
//     admin.initializeApp({
//       credential: admin.credential.cert({
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//         privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//       }),
//     });
//   // } else {
//   //   const require = createRequire(import.meta.url);
//   //   const serviceAccount = require("./serviceAccountKey.json");
//   //   admin.initializeApp({
//   //     credential: admin.credential.cert(serviceAccount),
//   //   });
//   }
// }

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  console.log("✅ Firebase Admin initialized");
}

export default admin;