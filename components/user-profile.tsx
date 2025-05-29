"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Edit3, Save, X } from "lucide-react"

interface UserProfileProps {
  userName: string
  userAvatar?: string
  onUserNameChange: (name: string) => void
  onAvatarChange: (avatar: string) => void
}

export function UserProfile({ userName, userAvatar, onUserNameChange, onAvatarChange }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(userName)
  const [tempAvatar, setTempAvatar] = useState(userAvatar || "")

  const handleSave = () => {
    onUserNameChange(tempName)
    onAvatarChange(tempAvatar)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempName(userName)
    setTempAvatar(userAvatar || "")
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="p-2 h-auto">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm text-gray-300">{userName}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Mi Perfil
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={isEditing ? tempAvatar : userAvatar} alt={userName} />
              <AvatarFallback className="bg-blue-600 text-white text-lg">
                {getInitials(isEditing ? tempName : userName)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <div className="w-full">
                <Label htmlFor="avatar" className="text-sm text-gray-300">
                  URL del Avatar
                </Label>
                <Input
                  id="avatar"
                  value={tempAvatar}
                  onChange={(e) => setTempAvatar(e.target.value)}
                  placeholder="https://ejemplo.com/avatar.jpg"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-gray-300">
              Nombre
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            ) : (
              <div className="p-2 bg-gray-800 rounded border border-gray-600">
                {userName}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}