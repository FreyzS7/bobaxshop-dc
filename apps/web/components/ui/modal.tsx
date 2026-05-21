'use client'

import * as React from 'react'
import { Dialog } from 'radix-ui'
import { cn } from '@/lib/utils'

function Modal({ ...props }: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root data-slot="modal" {...props} />
}

function ModalTrigger({ ...props }: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger data-slot="modal-trigger" {...props} />
}

function ModalPortal({ ...props }: React.ComponentProps<typeof Dialog.Portal>) {
  return <Dialog.Portal {...props} />
}

function ModalOverlay({ className, ...props }: React.ComponentProps<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      data-slot="modal-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

function ModalContent({ className, children, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <ModalPortal>
      <ModalOverlay />
      <Dialog.Content
        data-slot="modal-content"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
          'bg-card border border-border rounded-xl shadow-2xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </ModalPortal>
  )
}

function ModalHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="modal-header"
      className={cn('flex items-center justify-between px-5 py-4 border-b border-border', className)}
      {...props}
    />
  )
}

function ModalTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      data-slot="modal-title"
      className={cn('text-foreground font-semibold text-sm', className)}
      {...props}
    />
  )
}

function ModalDescription({ className, ...props }: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      data-slot="modal-description"
      className={cn('text-muted-foreground text-xs mt-0.5', className)}
      {...props}
    />
  )
}

function ModalClose({ className, ...props }: React.ComponentProps<typeof Dialog.Close>) {
  return (
    <Dialog.Close
      data-slot="modal-close"
      className={cn(
        'text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40',
        className
      )}
      {...props}
    />
  )
}

function ModalBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="modal-body"
      className={cn('p-5 space-y-3', className)}
      {...props}
    />
  )
}

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalClose,
  ModalBody,
}
