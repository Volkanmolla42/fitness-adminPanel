import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Database } from "@/types/supabase";
import { Link } from "react-router-dom";

// Database'den ContactMessage tipini genişlet
type ContactMessage = Database["public"]["Tables"]["contact_messages"]["Row"];

const Messages = () => {
  const [filter, setFilter] = useState<string>("all");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mesajları getir
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      return data;
    },
  });

  // Mesaj durumunu güncelle
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: updateData, error } = await supabase
        .from("contact_messages")
        .update({ status })
        .eq("id", id)
        .select();

      if (error) {
        throw error;
      }

      return { id, status, updateData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      const updatedMessages = queryClient.getQueryData(["messages"]);
      toast({
        title: "Durum güncellendi",
        description: "Mesaj durumu başarıyla güncellendi",
      });
    },
  });

  // Mesajı sil
  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: "Mesaj silindi",
        description: "Mesaj başarıyla silindi",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  // Filtrelenmiş mesajlar
  const filteredMessages = messages.filter((message) => {
    if (filter === "all") return true;
    return message.status === filter;
  });

  // Mesaj durumuna göre badge rengi
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">Yeni</Badge>;
      case "read":
        return <Badge variant="default">Okundu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Silme işlemini başlat
  const handleDeleteClick = (id: string) => {
    setMessageToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Silme işlemini onayla
  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessage.mutate(messageToDelete);
    }
  };

  // Okundu olarak işaretle
  const markAsRead = (id: string) => {
    updateStatus.mutate({ id, status: "read" });
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">İletişim Mesajları</CardTitle>
              <CardDescription>
                <Link
                  to="https://locafit-website.vercel.app/"
                  target="_blank"
                  className="text-blue-500 hover:text-blue-600"
                >
                  Web sitesi
                </Link>{" "}
                nden gönderilen mesajları görüntüleyin ve yönetin
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Mesajlar</SelectItem>
                <SelectItem value="new">Yeni Mesajlar</SelectItem>
                <SelectItem value="read">Okunmuş Mesajlar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Görüntülenecek mesaj bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gönderen</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow
                    key={message.id}
                    className={message.status === "read" ? "bg-muted/50" : ""}
                  >
                    <TableCell className="font-medium">
                      {message.name}
                    </TableCell>
                    <TableCell>{message.phone}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {message.message}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {message.status !== "read" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(message.id)}
                            title="Okundu Olarak İşaretle"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(message.id)}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          title="Mesajı Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Silme Onay Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Bu mesajı silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Mesaj kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Messages;
