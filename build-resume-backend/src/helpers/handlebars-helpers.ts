export function getImageSrc(bufferData: any): string {
  if (!bufferData || !bufferData.data) {
    console.error('Missing buffer data, returning fallback image.');
    return '/default-profile.png';
  }

  // Create a Blob from buffer or string
  if (typeof bufferData === 'string') {
    return bufferData;
  }

  // If the data is in Binary format, convert it to Buffer
  let buffer: Buffer;
  if (bufferData.data instanceof Buffer) {
    buffer = bufferData.data;
  } else if (bufferData.data && bufferData.data.buffer) {
    buffer = Buffer.from(bufferData.data.buffer);
  } else if (bufferData.data) {
    buffer = Buffer.from(bufferData.data);
  } else {
    return '/default-profile.png';
  }

  // Detect MIME type dynamically (default to PNG)
  const mimeType = bufferData.contentType || 'image/png';

  // Convert to Base64
  const base64String = buffer.toString('base64');

  return `data:${mimeType};base64,${base64String}`;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'Present';
  const date = new Date(dateString);
  // Check if invalid date
  if (isNaN(date.getTime())) return 'Present';

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
