import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const bucketName = process.env.AWS_S3_BUCKET_NAME!

export class S3Service {
  static async uploadSessionData(userId: string, sessionId: string, data: any): Promise<string> {
    const key = `sessions/${userId}/${sessionId}.json`
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    })

    await s3Client.send(command)
    return key
  }

  static async uploadReferenceData(userId: string, referenceId: string, data: any): Promise<string> {
    const key = `references/${userId}/${referenceId}.json`
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    })

    await s3Client.send(command)
    return key
  }

  static async uploadEssayContent(submissionId: string, content: string): Promise<string> {
    const key = `essays/${submissionId}.txt`
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: content,
      ContentType: 'text/plain',
    })

    await s3Client.send(command)
    return key
  }

  static async getSessionData(s3Key: string): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    })

    const response = await s3Client.send(command)
    const data = await response.Body?.transformToString()
    return data ? JSON.parse(data) : null
  }

  static async getReferenceData(s3Key: string): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    })

    const response = await s3Client.send(command)
    const data = await response.Body?.transformToString()
    return data ? JSON.parse(data) : null
  }

  static async getEssayContent(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    })

    const response = await s3Client.send(command)
    return await response.Body?.transformToString() || ''
  }

  static async deleteFile(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    })

    await s3Client.send(command)
  }

  static async getPresignedUploadUrl(key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
  }

  static async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
  }
} 