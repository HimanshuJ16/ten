"use client"

import { useEffect, useRef, useState } from "react"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import OSM from "ol/source/OSM"
import { fromLonLat } from "ol/proj"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import { Vector as VectorLayer } from "ol/layer"
import { Vector as VectorSource } from "ol/source"
import { Style, Icon } from "ol/style"
import "ol/ol.css"

interface TrackingMapProps {
  center: [number, number]
  zoom: number
}

export default function TrackingMap({ center, zoom }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapRef.current) return

    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat(center),
        zoom: zoom,
      }),
    })

    const markerFeature = new Feature({
      geometry: new Point(fromLonLat(center)),
    })

    const vectorSource = new VectorSource({
      features: [markerFeature],
    })

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: "/marker1.png", // Make sure this file exists in your public folder
        }),
      }),
    })

    initialMap.addLayer(vectorLayer)

    setMap(initialMap)

    return () => {
      initialMap.setTarget(undefined)
    }
  }, [isMounted, center]) // Added center to the dependency array

  useEffect(() => {
    if (!map) return

    const view = map.getView()
    const newCenter = fromLonLat(center)

    // --- THIS IS THE CHANGE ---
    // Animate the view (the map camera) to the new center
    view.animate({
      center: newCenter,
      duration: 500, // 500ms animation for a smooth pan
    })
    // -------------------------

    // Update the marker's position instantly
    const vectorLayer = map
      .getLayers()
      .getArray()
      .find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>
    if (vectorLayer) {
      const source = vectorLayer.getSource()
      const features = source?.getFeatures()
      if (features && features.length > 0) {
        const markerFeature = features[0]
        markerFeature.setGeometry(new Point(newCenter))
      }
    }
  }, [center, zoom, map]) // Keep zoom here in case you want to change it

  if (!isMounted) return null

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
}