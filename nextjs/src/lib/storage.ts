import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

const endpoint = process.env.MINIO_ENDPOINT || 'minio:9000'
const accessKey = process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || 'minioadmin'
const secretKey = process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin'
const bucket = process.env.MINIO_BUCKET || 'gunyayla'
const region = process.env.MINIO_REGION || 'us-east-1'

const publicUrlBase = process.env.MINIO_PUBLIC_URL || `http://${process.env.SITE_DOMAIN || 'localhost'}/uploads`

const s3 = new S3Client({
  endpoint: `http://${endpoint}`,
  region,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
})

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  })

  await upload.done()

  return `${publicUrlBase}/${key}`
}

export async function deleteFile(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
}
