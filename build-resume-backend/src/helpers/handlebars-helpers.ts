export function getImageSrc(bufferData: any): string {
  if (!bufferData || !bufferData.data) {
    console.error('Missing buffer data, returning fallback image.');
    return '/default-profile.png';
  }

  // If the data is in Binary format, convert it to Buffer
  let buffer: Buffer;
  if (bufferData.data instanceof Buffer) {
    buffer = bufferData.data;
  } else if (bufferData.data.buffer) {
    buffer = Buffer.from(bufferData.data.buffer);
  } else {
    buffer = Buffer.from(bufferData.data);
  }
  // Detect MIME type dynamically (default to PNG)
  const mimeType = bufferData.contentType || 'image/png';

  // Convert to Base64
  const base64String = buffer.toString('base64');

  return `data:${mimeType};base64,${base64String}`;
}
