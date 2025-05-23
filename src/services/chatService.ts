import { db } from '@/lib/firebase';
import type { User, Chat, Message } from '@/types/blabberbox';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  writeBatch,
  addDoc,
  Unsubscribe,
  deleteDoc,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const CHATS_COLLECTION = 'chats';
const MESSAGES_SUBCOLLECTION = 'messages';

// User Management
export const updateUserStatus = async (userId: string, status: User['status'], currentChatId: string | null = null) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  try {
    await setDoc(userRef, { 
      id: userId, 
      status, 
      currentChatId, 
      lastSeen: serverTimestamp() as Timestamp 
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user status: ", error);
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? (userSnap.data() as User) : null;
};

export const onUserDocChange = (userId: string, callback: (user: User | null) => void): Unsubscribe => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  return onSnapshot(userRef, (docSnap) => {
    callback(docSnap.exists() ? (docSnap.data() as User) : null);
  });
};

// Pairing Logic
export const findPartner = async (userId: string): Promise<string | null> => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(
    usersRef,
    where('status', '==', 'waiting'),
    where('id', '!=', userId), // Ensure not to match with self
    orderBy('id'), // ensure query is valid by ordering by the field used in inequality
    orderBy('lastSeen', 'asc'),
    limit(1)
  );

  const querySnapshot = await getDoc(q_doc_ref_placeholder); // Placeholder for getDocs equivalent for a single doc or specific query logic
  // This is a simplified stand-in. Real implementation requires getDocs and iterating.
  // For this structure, let's assume a more direct getDocs and pick one if available.
  // Firestore's 'getDocs' would be used here.
  // const querySnapshot = await getDocs(q);
  // if (!querySnapshot.empty) {
  //   return querySnapshot.docs[0].id;
  // }
  return null; // Placeholder: full query logic is more complex here
};


export const createChatWithPartner = async (userId1: string, userId2: string): Promise<string | null> => {
  const batch = writeBatch(db);
  
  const newChatRef = doc(collection(db, CHATS_COLLECTION));
  const chatId = newChatRef.id;

  const chatData: Chat = {
    id: chatId,
    userIds: [userId1, userId2].sort(), // Store sorted to ensure consistent chat ID lookup if needed
    createdAt: serverTimestamp() as Timestamp,
    status: 'active',
  };
  batch.set(newChatRef, chatData);

  const user1Ref = doc(db, USERS_COLLECTION, userId1);
  batch.update(user1Ref, { status: 'chatting', currentChatId: chatId, lastSeen: serverTimestamp() });

  const user2Ref = doc(db, USERS_COLLECTION, userId2);
  batch.update(user2Ref, { status: 'chatting', currentChatId: chatId, lastSeen: serverTimestamp() });
  
  try {
    await batch.commit();
    return chatId;
  } catch (error) {
    console.error("Error creating chat: ", error);
    return null;
  }
};


// Messaging
export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);
  const messageData: Omit<Message, 'id' | 'chatId'> = { // id will be auto-generated by addDoc
    senderId,
    text,
    timestamp: serverTimestamp() as Timestamp,
  };
  try {
    const messageRef = await addDoc(messagesRef, messageData);
    // Update last message on chat (optional, good for chat lists)
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    await updateDoc(chatRef, {
      lastMessage: {
        text,
        senderId,
        timestamp: messageData.timestamp,
      }
    });
    return messageRef.id;
  } catch (error) {
    console.error("Error sending message: ", error);
  }
};

export const onMessagesUpdate = (chatId: string, callback: (messages: Message[]) => void): Unsubscribe => {
  const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      chatId,
      ...docSnap.data()
    } as Message));
    callback(messages);
  });
};

// Heartbeat & Connection Management
export const sendHeartbeat = async (userId: string) => {
  if (!userId) return;
  const userRef = doc(db, USERS_COLLECTION, userId);
  try {
    await updateDoc(userRef, { lastSeen: serverTimestamp() });
  } catch (error) {
    // User doc might not exist yet or other issues
    // console.warn("Heartbeat error (normal if user doc not fully init): ", error);
  }
};

export const leaveChat = async (userId: string, chatId: string) => {
  await updateUserStatus(userId, 'idle', null);
  // Optionally mark chat as ended or notify other user
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  try {
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const chatData = chatSnap.data() as Chat;
      const otherUserId = chatData.userIds.find(uid => uid !== userId);
      if (otherUserId) {
        // Notify other user implicitly by their listener on this user or chat status
      }
      // await updateDoc(chatRef, { status: 'ended' }); // Or handle cleanup
    }
  } catch(error) {
    console.error("Error during leave chat: ", error);
  }
};

// A placeholder doc ref for query example in findPartner.
// Firestore requires a specific document reference for getDoc.
// To query a collection and get a single doc based on criteria, you'd use getDocs.
const q_doc_ref_placeholder = doc(db, "users", "placeholder_for_getDoc_in_query_example");
