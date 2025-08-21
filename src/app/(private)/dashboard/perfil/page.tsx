"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { database, storage } from "@/services/firebase";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import { updateProfile, updateEmail } from "firebase/auth";
import { auth } from "@/services/firebase";
import { Card } from "@/components/ui/card";
import { PlusCircle, UserCircle, Pencil, Trash2 } from "lucide-react";

export default function Perfil() {
  const { user } = useAuthContext();
  const uid = user?.uid;
  const [image, setImage] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; field: string | null }>({ open: false, field: null });
  const [editValue, setEditValue] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mapeamento dos campos para nomes amigáveis em português
  const fieldLabels: Record<string, string> = {
    name: 'nome',
    email: 'email',
    phone: 'telefone',
    cpf: 'CPF',
    cnae: 'CNAE',
    bio: 'biografia',
  };

  const fetchUserData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const docRef = doc(database, "User", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data?.imageUrl) {
          console.log('Imagem carregada:', data.imageUrl);
          setImage(data.imageUrl);
        }
      } else {
        // Se o documento não existir, cria um novo com os dados básicos do usuário
        const userData = {
          name: user?.displayName || "",
          email: user?.email || "",
          imageUrl: "",
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, userData);
        setProfile(userData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do perfil:", error);
      toast.error("Erro ao carregar dados do perfil!");
    } finally {
      setLoading(false);
    }
  }, [uid, user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleEdit = (field: string) => {
    setEditValue(profile[field] ? String(profile[field]) : '');
    setModal({ open: true, field });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSave = async () => {
    if (!uid || !modal.field) return;
    setModalLoading(true);
    try {
      const docRef = doc(database, "User", uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        // Se o documento não existir, cria um novo
        await setDoc(docRef, {
          [modal.field]: editValue,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Se existir, atualiza
        if (modal.field === 'name') {
          await updateProfile(auth.currentUser!, { displayName: editValue });
          await updateDoc(docRef, { name: editValue });
        } else if (modal.field === 'email') {
          await updateEmail(auth.currentUser!, editValue);
          await updateDoc(docRef, { email: editValue });
        } else {
          await updateDoc(docRef, { [modal.field]: editValue });
        }
      }
      
      setProfile((prev: Record<string, unknown>) => ({ ...prev, [modal.field!]: editValue }));
      setModal({ open: false, field: null });
      toast.success("Campo atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      toast.error("Erro ao atualizar campo!");
    } finally {
      setModalLoading(false);
    }
  };

  const updateRegisterImageUrl = async (uid: string, url: string) => {
    // Busca o documento do usuário na coleção Register
    const q = query(collection(database, "Register"), where("id", "==", uid));
    const querySnapshot = await getDocs(q);
    for (const docSnap of querySnapshot.docs) {
      await updateDoc(doc(database, "Register", docSnap.id), { imageUrl: url });
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!uid) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `perfil/${uid}/${new Date().getTime()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const docRef = doc(database, "User", uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          imageUrl: url,
          createdAt: new Date().toISOString(),
        });
      } else {
        await updateDoc(docRef, { imageUrl: url });
      }
      console.log('Nova URL da imagem:', url);
      setImage(url);
      setProfile((prev: Record<string, unknown>) => ({ ...prev, imageUrl: url }));
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url });
        await auth.currentUser.reload();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('authUserUpdated'));
        }
      }
      await updateRegisterImageUrl(uid, url);
      toast.success("Imagem atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Erro ao atualizar imagem!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!uid || !image) return;
    try {
      const filePath = decodeURIComponent(
        image.substring(image.indexOf('/o/') + 3, image.indexOf('?'))
      );
      const imageRef = ref(storage, filePath);
      await deleteObject(imageRef);
      const docRef = doc(database, "User", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { imageUrl: "" });
      }
      setImage(null);
      setProfile((prev: Record<string, unknown>) => ({ ...prev, imageUrl: "" }));
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: "" });
        await auth.currentUser.reload();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('authUserUpdated'));
        }
      }
      toast.success("Imagem removida!");
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      toast.error("Erro ao remover imagem!");
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Perfil</h1>
        
        <div className="flex flex-col items-center mb-8">
          {isUploading && (
            <div className="mb-4 text-sm text-gray-600">
              Enviando imagem...
            </div>
          )}
          <div className="relative group" style={{ minHeight: '160px', minWidth: '160px' }}>
            {image ? (
              <div className="relative">
                <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                  <img 
                    src={image || "/avatar.png"} 
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onLoad={() => {
                      console.log('Imagem carregada com sucesso:', image);
                    }}
                    onError={(e) => {
                      console.log('Erro ao carregar imagem:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {!image && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <span className="text-4xl font-bold">
                        {user?.displayName?.[0] || user?.email?.[0] || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      disabled={isUploading}
                    />
                    <PlusCircle className="h-8 w-8 text-white" />
                  </label>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2"
                  onClick={handleDeleteImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={isUploading}
                />
                <div className="relative">
                  <UserCircle className="h-40 w-40 text-gray-400" />
                  <PlusCircle className="absolute bottom-0 right-0 h-8 w-8 text-primary" />
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nome</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex-1">{typeof profile.name === 'string' ? profile.name : user?.displayName || "-"}</span>
                <Button size="sm" variant="outline" onClick={() => handleEdit('name')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex-1">{typeof profile.email === 'string' ? profile.email : user?.email || "-"}</span>
                <Button size="sm" variant="outline" onClick={() => handleEdit('email')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>ID</Label>
              <div className="mt-1">
                <span>{user?.uid ? (user.uid.length > 10 ? user.uid.substring(0, 15) + '...' : user.uid) : "-"}</span>
              </div>
            </div>

            <div>
              <Label>Telefone</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex-1">{typeof profile.phone === 'string' ? profile.phone : "Adicione seu telefone"}</span>
                <Button size="sm" variant="outline" onClick={() => handleEdit('phone')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>CPF</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex-1">{typeof profile.cpf === 'string' ? profile.cpf : "Adicione seu CPF"}</span>
                <Button size="sm" variant="outline" onClick={() => handleEdit('cpf')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>CNAE</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex-1">{typeof profile.cnae === 'string' ? profile.cnae : "Adicione seu CNAE"}</span>
                <Button size="sm" variant="outline" onClick={() => handleEdit('cnae')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Biografia</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex-1">{typeof profile.bio === 'string' ? profile.bio : "Adicione sua biografia"}</span>
              <Button size="sm" variant="outline" onClick={() => handleEdit('bio')}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de edição */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setModal({ open: false, field: null })}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setModal({ open: false, field: null })}>
              <span aria-hidden>×</span>
            </button>
            <h2 className="text-lg font-bold mb-4 capitalize">Editar {fieldLabels[modal.field!] || modal.field}</h2>
            <Input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="mb-4"
              placeholder={`Digite o novo ${fieldLabels[modal.field!] || modal.field}`}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModal({ open: false, field: null })}>Cancelar</Button>
              <Button onClick={handleSave} disabled={modalLoading}>
                {modalLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 