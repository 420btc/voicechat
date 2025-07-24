"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, Edit3, Save, X, Upload, Camera, Settings, BarChart3, 
  MessageSquare, Clock, Mic, FileText, Palette, Bell, 
  Shield, Download, Trash2, Activity, Calendar, Star
} from "lucide-react"
import { Theme } from "@/components/theme-selector"

interface UserProfileProps {
  userName: string
  userAvatar?: string
  onUserNameChange: (name: string) => void
  onAvatarChange: (avatar: string) => void
  userStats: {
    totalConversations: number
    totalMessages: number
    voiceMessages: number
    textMessages: number
    favoriteProvider: string
    totalTime: string
    joinDate: string
  }
  userPreferences: {
    theme: Theme
    language: string
    notifications: boolean
    autoSave: boolean
    compactMode: boolean
    voiceAutoSend: boolean
  }
  onPreferencesChange: (preferences: UserProfileProps['userPreferences']) => void
  onExportData: () => void
}

export function UserProfile({ 
  userName, 
  userAvatar, 
  onUserNameChange, 
  onAvatarChange,
  userStats,
  userPreferences,
  onPreferencesChange,
  onExportData
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(userName)
  const [tempAvatar, setTempAvatar] = useState(userAvatar || "")
  const [tempBio, setTempBio] = useState("")
  const [preferences, setPreferences] = useState(userPreferences)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    onUserNameChange(tempName)
    onAvatarChange(tempAvatar)
    setIsEditing(false)
  }

  const handlePreferenceChange = (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    onPreferencesChange(newPreferences)
  }



  const handleCancel = () => {
    setTempName(userName)
    setTempAvatar(userAvatar || "")
    setIsEditing(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setTempAvatar(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
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
              <AvatarImage src={userAvatar} alt={userName} className="object-cover" />
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm text-gray-300">{userName}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Mi Perfil
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Preferencias
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividad
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6 mt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={isEditing ? tempAvatar : userAvatar} alt={userName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xl">
                    {getInitials(isEditing ? tempName : userName)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={handleUploadClick}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold">{isEditing ? tempName : userName}</h3>
                <Badge variant="secondary" className="mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Miembro desde {userStats.joinDate}
                </Badge>
              </div>
              
              {isEditing && (
                <div className="w-full space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <div>
                    <Label htmlFor="avatar" className="text-sm text-muted-foreground">
                      URL del Avatar
                    </Label>
                    <Input
                      id="avatar"
                      value={tempAvatar}
                      onChange={(e) => setTempAvatar(e.target.value)}
                      placeholder="https://ejemplo.com/avatar.jpg"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio" className="text-sm text-muted-foreground">
                      Biografía
                    </Label>
                    <Textarea
                      id="bio"
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      placeholder="Cuéntanos algo sobre ti..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm text-muted-foreground">
                  Nombre de Usuario
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Tu nombre de usuario"
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {userName}
                  </div>
                )}
              </div>
              
              {!isEditing && tempBio && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Biografía
                  </Label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {tempBio || "Sin biografía"}
                  </div>
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
                <>
                  <Button variant="outline" size="sm" onClick={onExportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Datos
                  </Button>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Conversaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalConversations}</div>
                  <p className="text-xs text-muted-foreground">Total de conversaciones</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Mensajes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">Mensajes enviados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Mensajes de Voz
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.voiceMessages}</div>
                  <p className="text-xs text-muted-foreground">Grabaciones de audio</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Tiempo Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalTime}</div>
                  <p className="text-xs text-muted-foreground">Tiempo de uso</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Proveedor Favorito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{userStats.favoriteProvider}</span>
                  <Badge variant="secondary">Más usado</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6 mt-6">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Apariencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme">Tema</Label>
                      <Select value={preferences.theme} onValueChange={(value) => handlePreferenceChange('theme', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Claro</SelectItem>
                          <SelectItem value="dark">Oscuro</SelectItem>
                          <SelectItem value="system">Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compact">Modo Compacto</Label>
                      <Switch
                        id="compact"
                        checked={preferences.compactMode}
                        onCheckedChange={(checked) => handlePreferenceChange('compactMode', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notificaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Notificaciones</Label>
                      <Switch
                        id="notifications"
                        checked={preferences.notifications}
                        onCheckedChange={(checked) => handlePreferenceChange('notifications', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Funcionalidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autosave">Auto-guardado</Label>
                      <Switch
                        id="autosave"
                        checked={preferences.autoSave}
                        onCheckedChange={(checked) => handlePreferenceChange('autoSave', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="voiceautosend">Envío automático de voz</Label>
                      <Switch
                        id="voiceautosend"
                        checked={preferences.voiceAutoSend}
                        onCheckedChange={(checked) => handlePreferenceChange('voiceAutoSend', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="language">Idioma</Label>
                      <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Privacidad y Datos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start" onClick={onExportData}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar mis datos
                    </Button>
                    
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar todos los datos
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Nueva conversación creada</p>
                        <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Mic className="w-4 h-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Mensaje de voz enviado</p>
                        <p className="text-xs text-muted-foreground">Hace 4 horas</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Settings className="w-4 h-4 text-orange-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Configuración actualizada</p>
                        <p className="text-xs text-muted-foreground">Ayer</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Upload className="w-4 h-4 text-purple-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Avatar actualizado</p>
                        <p className="text-xs text-muted-foreground">Hace 3 días</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}