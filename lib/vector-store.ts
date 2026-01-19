import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { QdrantVectorStore } from "@langchain/qdrant";

export async function getVectorStore(collectionName: string = "default") {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  
  return await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: "http://localhost:6333",
    collectionName: collectionName,
  });
}

export async function embedPDF(pdfPath: string | Blob, pointId: string | string[], collectionName: string = "default") {
  const loader = new PDFLoader(pdfPath);
  const docs = await loader.load();
  
  docs.map((doc, idx) => {
    doc.metadata = {
      ...doc.metadata,
      pointId: Array.isArray(pointId) ? pointId[idx] : pointId,
      type: "pdf",
    };
    return doc;
  });
  
  console.log(`Loaded ${docs.length} documents from PDF. Indexing without splitting (backend logic).`);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: "http://localhost:6333",
    collectionName: collectionName,
  });

  console.log(`PDF indexed for session ${collectionName}`);
}

export async function embedURL(url: string, pointId: string | string[], collectionName: string = "default") {
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();

  docs.map((doc, idx) => {
    doc.metadata = {
      ...doc.metadata,
      pointId: Array.isArray(pointId) ? pointId[idx] : pointId,
      type: "url",
    };
    return doc;
  });

  console.log(`Loaded ${docs.length} documents from URL. Indexing without splitting (backend logic).`);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: "http://localhost:6333",
    collectionName: collectionName,
  });

  console.log(`URL indexed for session ${collectionName}`);
}

export async function deletePointFromCollection(pointId: string, collectionName: string = "default") {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: "http://localhost:6333",
    collectionName: collectionName,
  });
  
  const filter = {
    must: [
      {
        key: "metadata.pointId",
        match: { value: pointId },
      },
    ],
  };

  try {
    await vectorStore.client.delete(collectionName, {
        filter: filter
    });
    console.log(`Deleted all points with pointId: ${pointId}`);
  } catch (err) {
      console.error("Error deleting points from Qdrant:", err);
      throw err;
  }
}

export async function queryVectorStore(query: string, k: number = 4, collectionName: string = "default") {
  const vectorStore = await getVectorStore(collectionName);
  const results = await vectorStore.similaritySearch(query, k);
  return results;
}
