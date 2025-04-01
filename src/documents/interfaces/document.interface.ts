export interface Document {
  id: string;
  title: string;
  content: any[];
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  childrenIds: string[];
}
