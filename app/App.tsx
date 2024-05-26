"use client"
import { fabric } from 'fabric';
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { useEffect, useRef, useState } from "react";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvasObjectScaling, handleCanvasSelectionCreated, handleCanvaseMouseMove, handlePathCreated, handleResize, initializeFabric, renderCanvas } from '@/lib/canvas';
import { ActiveElement, Attributes } from '@/types/type';
import { useMutation, useRedo, useStorage, useUndo } from '@/liveblocks.config';
import { defaultNavElement } from '@/constants';
import { handleDelete, handleKeyDown } from '@/lib/key-events';
import { handleImageUpload } from '@/lib/shapes';

export default function Page() {
  const redo = useUndo();
  const undo = useRedo();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const isEditingRef = useRef<boolean>(false);
  const isDrawing = useRef<boolean>(false);

  const canvasObjects = useStorage((root) => root.canvasObjects)

  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: '',
    fontSize: '',
    fontWeight: '',
    fontFamily: '',
    fill: '#aabbcc',
    stroke: '#aabbcc'
})

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;
    const { objectId } = object;
    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get('canvasObjects');
    canvasObjects.set(objectId, shapeData);
  }, []);

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: '',
    value: '',
    icon: '',
  });

  const deletAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects");
    if (!canvasObjects || canvasObjects.size === 0) return true;

    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }
    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
    const canvasObjects = storage.get('canvasObjects');

    canvasObjects.delete(objectId);

  }, [])


  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);
    switch (elem?.value) {
      case "reset":
        deletAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement);
        break;
      case "delete":
        handleDelete(
          fabricRef.current as any,
          deleteShapeFromStorage)
        setActiveElement(defaultNavElement);
        break;
      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false
        }
        break;
      default:
        break;
    }

    selectedShapeRef.current = elem?.value as string;
  }

  useEffect(() => {

    const canvas = initializeFabric({
      canvasRef, fabricRef
    })
    canvas.on("mouse:down", (options: any) => {
      handleCanvasMouseDown({
        options,
        isDrawing,
        canvas,
        selectedShapeRef,
        shapeRef
      });
    })
    canvas.on("mouse:move", (options: any) => {
      handleCanvaseMouseMove({
        options,
        isDrawing,
        canvas,
        selectedShapeRef,
        shapeRef,
        syncShapeInStorage
      });
    })
    canvas.on("mouse:up", (options: any) => {
      handleCanvasMouseUp({
        isDrawing,
        canvas,
        selectedShapeRef,
        shapeRef,
        syncShapeInStorage,
        setActiveElement,
        activeObjectRef
      });
    })
    canvas.on("object-modified", (options: any) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      });
    })
    canvas.on("selection:created", (options: any) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      });
    })
    canvas.on("object:scaling", (options: any) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes,
      });
    })
    canvas.on("path:created", (options: any) => {
      handlePathCreated({
        options,
       syncShapeInStorage
      });
    })
    window.addEventListener("resize", () => {
      handleResize({ fabricRef })
    })
    window.addEventListener("keydown", (e: any) => {
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      })
    })
    return () => {
      canvas.dispose();
    }
  }, [])
  useEffect(() => {
    renderCanvas({
      fabricRef,
      activeObjectRef,
      canvasObjects
    })
  }, [canvasObjects])
  return (
    <div className="h-screen overflow-hidden">
      <Navbar
        handleImageUpload={(e) => {
          e.stopPropagation();
          handleImageUpload({
            file: e.target.files![0],
            canvas: fabricRef as any,
            syncShapeInStorage,
            shapeRef
          })
        }}
        imageInputRef={imageInputRef}
        activeElement={activeElement}
        handleActiveElement={handleActiveElement} />
      <section className="flex h-full flex-row">
        <LeftSidebar allShapes={Array.from(canvasObjects)} />
        <Live undo={undo} redo={redo} canvasRef={canvasRef} />
        <RightSidebar
        isEditingRef={isEditingRef}
        elementAttributes={elementAttributes}
        setElementAttributes={setElementAttributes}
        fabricRef={fabricRef}
        activeObjectRef={activeObjectRef}
        syncShapeInStorage={syncShapeInStorage}
        />

      </section>
    </div>
  );
}