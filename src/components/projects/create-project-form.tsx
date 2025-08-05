'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createProject } from '@/actions/project-actions';
import { useRouter } from 'next/navigation';
import { Folder, Plus } from 'lucide-react';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  folderId: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface Folder {
  id: string;
  name: string;
  color?: string | null;
}

interface CreateProjectFormProps {
  folders: Folder[];
}

export const CreateProjectForm = ({ folders }: CreateProjectFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      folderId: 'no-folder',
    },
  });

  const onSubmit = async (data: CreateProjectForm) => {
    setIsLoading(true);
    try {
      const project = await createProject({
        name: data.name,
        description: data.description || undefined,
        folderId: data.folderId === 'no-folder' ? undefined : data.folderId || undefined,
      });
      
      // Redirecionar para o editor do projeto criado
      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do projeto *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite o nome do projeto..." 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o que este projeto faz..." 
                        className="resize-none"
                        rows={3}
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Uma breve descrição do seu projeto (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pasta</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma pasta (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-folder">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-dashed border-muted-foreground" />
                            <span>Sem pasta</span>
                          </div>
                        </SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: folder.color || '#6b7280' }}
                              />
                              <span>{folder.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Organize seu projeto em uma pasta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Templates (futuro) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Templates de projeto em breve!</p>
            <p className="text-sm mt-1">
              Comece rapidamente com modelos pré-configurados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};