import { doc, collection, query, where, getDoc, getDocs } from "firebase/firestore";
import { firestore } from "@/firebase/server"; // Server-side Firebase client
import BakeryDetailClient from "./BakeryDetailClient";
import { notFound } from "next/navigation";
import type { JSX } from "react";

// The props object now includes a `params` property
type Props = {
  params: { id: string };
};

// The component is async and receives props
export default async function BakeryDetailPage(props: Props): Promise<JSX.Element> {
  const id = props.params.id; // This can be either doc ID or userId

  if (!id) {
    notFound();
  }

  // We need to find the baker, but the ID could be the doc ID or the userId.
  // We prioritize querying by userId as it's our consistent identifier.
  let bakeryData;
  const bakeryQueryByUserId = query(collection(firestore, "bakers"), where("userId", "==", id));
  const bakeryQuerySnap = await getDocs(bakeryQueryByUserId);

  if (!bakeryQuerySnap.empty) {
      const firstDoc = bakeryQuerySnap.docs[0];
      if (firstDoc.data().approvalStatus === 'approved') {
          bakeryData = { id: firstDoc.id, ...firstDoc.data() };
      }
  } else {
    // Fallback: if no user is found by userId, try to get by document ID.
    const bakeryDocSnap = await getDoc(doc(firestore, "bakers", id));
    if (bakeryDocSnap.exists() && bakeryDocSnap.data().approvalStatus === 'approved') {
        bakeryData = { id: bakeryDocSnap.id, ...bakeryDocSnap.data() };
    }
  }
  
  if (!bakeryData) {
    notFound(); 
  }

  // Load products using the consistent userId
  const productsQuery = query(collection(firestore, "products"), where("bakerId", "==", bakeryData.userId));
  const productsSnap = await getDocs(productsQuery);
  const products = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return <BakeryDetailClient bakery={bakeryData} products={products} />;
}
