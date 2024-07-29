import React, { useRef, useEffect, useState, ChangeEvent } from 'react'
import * as THREE from 'three'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'

const MyThreeJSComponent: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function fileBufferToSplatBuffer(
    fileBufferData,
    format,
    alphaRemovalThreshold,
    compressionLevel,
    sectionSize,
    sceneCenter,
    blockSize,
    bucketSize,
    outSphericalHarmonicsDegree = 0,
  ) {
    if (format === GaussianSplats3D.SceneFormat.Ply) {
      return GaussianSplats3D.PlyLoader.loadFromFileData(
        fileBufferData.data,
        alphaRemovalThreshold,
        compressionLevel,
        outSphericalHarmonicsDegree,
        sectionSize,
        sceneCenter,
        blockSize,
        bucketSize,
      )
    } else {
      if (format === GaussianSplats3D.SceneFormat.Splat) {
        return GaussianSplats3D.SplatLoader.loadFromFileData(
          fileBufferData.data,
          alphaRemovalThreshold,
          compressionLevel,
          sectionSize,
          sceneCenter,
          blockSize,
          bucketSize,
        )
      } else {
        return GaussianSplats3D.KSplatLoader.loadFromFileData(fileBufferData.data)
      }
    }
  }

  useEffect(() => {
    if (!selectedFile) return

    const filePath = selectedFile.name.trim()
    const format = GaussianSplats3D.LoaderUtils.sceneFormatFromPath(filePath)

    const fileReader = new FileReader()
    fileReader.onload = () => {
      const splatBufferData = fileReader.result
      const splatAlphaRemovalThreshold = 5 // out of 255
      const sphericalHarmonicsDegree = 1

      const splatBufferPromise = fileBufferToSplatBuffer(
        { data: splatBufferData },
        format,
        splatAlphaRemovalThreshold,
        0,
        undefined,
        undefined,
        undefined,
        undefined,
        sphericalHarmonicsDegree,
      )
      const splatBufferOptions = {
        splatAlphaRemovalThreshold: splatAlphaRemovalThreshold,
      }
      splatBufferPromise.then((splatBuffer) => {
        const viewerOptions = {
          cameraUp: [0, 0, 0],
          initialCameraPosition: [1, 1, 1],
          initialCameraLookAt: [0, 0, 0],
          halfPrecisionCovariancesOnGPU: false,
          antialiased: false,
          sphericalHarmonicsDegree: sphericalHarmonicsDegree,
        }
        const viewer = new GaussianSplats3D.Viewer(viewerOptions)
        viewer.renderer.setClearColor('#000000')
        viewer.addSplatBuffers([splatBuffer], [splatBufferOptions]).then(() => {
          viewer.start()
        })
      })
    }
    fileReader.readAsArrayBuffer(selectedFile)

  }, [selectedFile])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file !== undefined) {
      setSelectedFile(file)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <div ref={sceneRef}></div>
    </div>
  )
}

export default MyThreeJSComponent
