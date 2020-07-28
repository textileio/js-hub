/* eslint-disable @typescript-eslint/no-use-before-define */
import { Buffer } from 'buffer'
import { ListPathItem, ListPathReply } from '@textile/buckets-grpc/buckets_pb'
import { bucketsListPath, BucketsGrpcClient } from './api'
/**
 * utilBufToArray converts a buffer into <4mb chunks for use with grpc API
 * @param chunk an input Buffer
 */
export function utilBufToArray(chunk: Buffer, size = 1024 * 1024 * 3) {
  const result = []
  const len = chunk.length
  let i = 0
  while (i < len) {
    result.push(chunk.slice(i, (i += size)))
  }
  return result
}

export type ListPathRecursive = ReturnType<typeof utilListPathRecursive>
/**
 * listPathRecursive returns a nested object of all paths (and info) in a bucket
 */
export async function utilListPathRecursive(grpc: BucketsGrpcClient, bucketKey: string, path: string) {
  const rootPath = path === '' || path === '.' || path === '/' ? '' : `${path}/`
  const tree = await bucketsListPath(grpc, bucketKey, path)
  const { item } = tree
  if (item) {
    for (let i = 0; i < item.itemsList.length; i++) {
      const obj = item.itemsList[i]
      if (!obj.isdir) continue
      const dirPath = `${rootPath}${obj.name}`
      const dir = await utilListPathRecursive(grpc, bucketKey, dirPath)
      if (dir) {
        item.itemsList[i] = dir
      }
    }
  }
  return item
}

async function treeToPaths(tree: ListPathItem.AsObject, path?: string, dirs = true): Promise<Array<string>> {
  const result = []
  const fp = path ? `${path}/${tree.name}` : `${tree.name}`
  // Only push if dirs included or not a dir
  if (dirs || !tree.isdir) result.push(fp)
  if (tree.isdir) {
    for (const item of tree.itemsList) {
      const downtree = await treeToPaths(item, fp, dirs)
      result.push(...downtree)
    }
  }
  return result
}

export type ListPathRecursiveFlat = ReturnType<typeof utilListPathRecursiveFlat>

/**
 * utilPathsList returns a string array of all paths in a bucket
 */
export async function utilListPathRecursiveFlat(grpc: BucketsGrpcClient, bucketKey: string, path: string, dirs = true) {
  const tree = await utilListPathRecursive(grpc, bucketKey, path)
  if (!tree) return []
  return treeToPaths(tree, undefined, dirs)
}
