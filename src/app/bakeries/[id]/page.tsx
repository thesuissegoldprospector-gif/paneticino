import { doc, collection, query, where, getDoc, getDocs } from "firebase/firestore";
import { firestore } from "@/firebase/server"; // Server-side Firebase client
import BakeryDetailClient from "./BakeryDetailClient";
import { notFound } from "next/navigation";

// The props object now includes a `params` property
type Props = {
  params: { id: string };
};

// The component is async and receives props
export default async function BakeryDetailPage(props: Props) {
  const id = props.params.id;

  if (!id) {
    notFound();
  }

  // 1️⃣ Prova a leggere documento con ID = route param
  let bakeryDocSnap = await getDoc(doc(firestore, "bakers", id));
  let bakeryData;

  // 2️⃣ fallback: query per userId
  if (bakeryDocSnap.exists() && bakeryDocSnap.data().approvalStatus === 'approved') {
      bakeryData = { id: bakeryDocSnap.id, ...bakeryDocSnap.data() };
  } else {
    const bakeryQuery = query(collection(firestore, "bakers"), where("userId", "==", id));
    const bakeryQuerySnap = await getDocs(bakeryQuery);
    if (!bakeryQuerySnap.empty) {
        const firstDoc = bakeryQuerySnap.docs[0];
        if (firstDoc.data().approvalStatus === 'approved') {
            bakeryData = { id: firstDoc.id, ...firstDoc.data() };
        }
    }
  }

  if (!bakeryData) {
    notFound(); 
  }

  // 3️⃣ Carica prodotti server-side
  const productsQuery = query(collection(firestore, "products"), where("bakerId", "==", bakeryData.id));
  const productsSnap = await getDocs(productsQuery);
  const products = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return <BakeryDetailClient bakery={bakeryData} products={products} />;
}
