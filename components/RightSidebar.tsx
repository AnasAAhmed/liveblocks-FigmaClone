import React, { useRef } from 'react'
import Dimensions from './settings/Dimensions'
import Text from './settings/Text'
import Color from './settings/Color'
import Export from './settings/Export'
import { RightSidebarProps } from '@/types/type'
import { modifyShape } from '@/lib/shapes'
import { fabric } from 'fabric'

const RightSidebar = ({
  elementAttributes,
  setElementAttributes,
  fabricRef,
  syncShapeInStorage,
  isEditingRef,
  activeObjectRef
}: RightSidebarProps) => {

  const colorInputRef = useRef(null);
  const strokeInputRef = useRef(null);

  const handleInputChange = (property: string, value: string) => {
    if (!isEditingRef.current) isEditingRef.current = true
    setElementAttributes((prev) => ({
      ...prev, [property]: value
    }))
    modifyShape({
      canvas: fabricRef.current as fabric.Canvas,
      activeObjectRef,
      value,
      property,
      syncShapeInStorage
    })
  }

  return (
    <section className="flex flex-col border-t border-primary-grey-200 bg-primary-black text-primary-grey-300 min-2-[227px] sticky right-0 h-full max-sm:hidden select-none">
      <h3 className='px-5 pt-4 text-xs uppercase'>Design</h3>
      <span className="text-sm text-primary-grey-300 mt-3 px-5 border-b pb-4 border-primary-grey-200">Make changes to canvas as you like
      </span>
      <Dimensions
        width={elementAttributes.width}
        height={elementAttributes.height}
        isEditingRef={isEditingRef}
        handleInputChange={handleInputChange}
      />
      <Text
        handleInputChange={handleInputChange}
        fontFamily={elementAttributes.fontFamily}
        fontSize={elementAttributes.fontSize}
        fontWeight={elementAttributes.fontWeight}
      />
      <Color
        inputRef={colorInputRef}
        placeholder='color'
        attributeType='fill'
        attribute={elementAttributes.fill}
        handleInputChange={handleInputChange}
      />
      <Color 
      inputRef={strokeInputRef}
      placeholder='stroke'
      attributeType='stroke'
      attribute={elementAttributes.stroke}
      handleInputChange={handleInputChange}
      />
      <Export />
    </section>
  )
}

export default RightSidebar
