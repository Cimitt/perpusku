'use client'

import { useState } from 'react'
import { SendIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ManualInputProps {
  placeholder?: string
  onSubmit: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function ManualInput({ placeholder, onSubmit, disabled, autoFocus }: ManualInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    if (!value.trim()) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <div className='flex gap-2'>
      <Input
        placeholder={placeholder || 'Masukkan kode...'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      <Button onClick={handleSubmit} disabled={disabled || !value.trim()}>
        <SendIcon className='size-4' />
      </Button>
    </div>
  )
}
