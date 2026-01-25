export class TfidfUtil {
    /**
     * Tokenizes text into an array of words, removing punctuation and lowercasing.
     */
    static tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 2); // Filter out very short words
    }

    /**
     * Calculates Term Frequency (TF) for a document.
     */
    static calculateTF(terms: string[]): Record<string, number> {
        const tf: Record<string, number> = {};
        const totalTerms = terms.length;
        terms.forEach((term) => {
            tf[term] = (tf[term] || 0) + 1;
        });
        // Normalize
        Object.keys(tf).forEach((term) => {
            tf[term] = tf[term] / totalTerms;
        });
        return tf;
    }

    /**
     * Calculates Inverse Document Frequency (IDF) for a set of documents.
     * For our case (Resume + JD), N=2.
     */
    static calculateIDF(documents: string[][]): Record<string, number> {
        const idf: Record<string, number> = {};
        const N = documents.length;
        const allUniqueTerms = new Set(documents.flat());

        allUniqueTerms.forEach((term) => {
            let docCount = 0;
            documents.forEach((doc) => {
                if (doc.includes(term)) docCount++;
            });
            idf[term] = Math.log(N / (docCount || 1)); // Avoid division by zero
        });
        return idf;
    }

    /**
     * Computes TF-IDF vectors for two texts (Resume and JD).
     * Returns validation metrics including Cosine Similarity and Missing Keywords.
     */
    static computeTFIDF(
        text1: string,
        text2: string
    ): { score: number; missingKeywords: string[] } {
        const tokens1 = this.tokenize(text1); // Resume
        const tokens2 = this.tokenize(text2); // JD

        // specialized stop words could be added here
        const tf1 = this.calculateTF(tokens1);
        const tf2 = this.calculateTF(tokens2);

        const idf = this.calculateIDF([tokens1, tokens2]);

        const terms = Array.from(new Set([...Object.keys(tf1), ...Object.keys(tf2)]));
        const vec1: number[] = [];
        const vec2: number[] = [];

        terms.forEach((term) => {
            const val1 = (tf1[term] || 0) * (idf[term] || 0);
            const val2 = (tf2[term] || 0) * (idf[term] || 0);
            vec1.push(val1);
            vec2.push(val2);
        });

        const score = this.cosineSimilarity(vec1, vec2);

        // Identify Missing Keywords: High TF-IDF in JD (vec2) but Zero/Low in Resume (vec1)
        const missing: { term: string; value: number }[] = [];
        terms.forEach((term, idx) => {
            if (vec2[idx] > 0 && vec1[idx] === 0) {
                missing.push({ term, value: vec2[idx] });
            }
        });

        // Sort by importance (weight in JD) and take top 20
        const missingKeywords = missing
            .sort((a, b) => b.value - a.value)
            .slice(0, 20)
            .map((item) => item.term);

        return { score, missingKeywords };
    }

    static cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
