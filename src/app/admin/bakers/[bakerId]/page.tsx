import { doc, collection, query, where, getDoc, getDocs, orderBy } from "firebase/firestore";
import { firestore } from "@/firebase/server"; 
import { notFound } from "next/navigation";
import BakerReportClient from "./BakerReportClient";

type Props = {
  params: { bakerId: string };
};

export default async function BakerReportPage({ params }: Props) {
  const { bakerId } = params;

  if (!bakerId) {
    notFound();
  }

  // Fetch baker details
  const bakerDocSnap = await getDoc(doc(firestore, "bakers", bakerId));
  if (!bakerDocSnap.exists()) {
    notFound();
  }
  const baker = { id: bakerDocSnap.id, ...bakerDocSnap.data() };

  // Fetch all orders for this baker, ordered by date
  const ordersQuery = query(
    collection(firestore, "orders"), 
    where("bakerId", "==", bakerId),
    orderBy("createdAt", "desc")
  );
  const ordersSnap = await getDocs(ordersQuery);
  const orders = ordersSnap.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    // Convert Firestore Timestamp to a serializable format (ISO string)
    createdAt: doc.data().createdAt.toDate().toISOString(),
  }));

  return <BakerReportClient baker={baker} orders={orders} />;
}
