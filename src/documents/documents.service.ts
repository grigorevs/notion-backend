import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Document } from './interfaces/document.interface';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly dataFilePath = path.join(
    process.cwd(),
    'data',
    'documents.json',
  );

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    try {
      const documents = await this.findAll();
      const newDocument: Document = {
        id: uuidv4(),
        title: createDocumentDto.title,
        content: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: createDocumentDto.parentId || null,
        childrenIds: [],
      };

      documents.push(newDocument);
      await this.saveData(documents);

      if (createDocumentDto.parentId) {
        await this.addChildToParent(createDocumentDto.parentId, newDocument.id);
      }

      return newDocument;
    } catch (error) {
      throw new HttpException(
        'Ошибка при создании документа: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    try {
      const documents = await this.findAll();
      const index = documents.findIndex((doc) => doc.id === id);

      if (index === -1) {
        throw new NotFoundException(`Document with id ${id} not found`);
      }

      const updatedDocument = {
        ...documents[index],
        ...updateDocumentDto,
        updatedAt: new Date(),
      };

      documents[index] = updatedDocument;
      await this.saveData(documents);
      return updatedDocument;
    } catch (error) {
      throw new HttpException(
        'Ошибка при обновлении документа: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async addChildToParent(
    parentId: string,
    childId: string,
  ): Promise<void> {
    const documents = await this.findAll();
    const parentIndex = documents.findIndex((doc) => doc.id === parentId);

    if (parentIndex === -1) {
      throw new NotFoundException(
        `Parent document with id ${parentId} not found`,
      );
    }

    if (!documents[parentIndex].childrenIds.includes(childId)) {
      documents[parentIndex].childrenIds.push(childId);
      await this.saveData(documents);
    }
  }

  async findAll(): Promise<Document[]> {
    try {
      const data = await fs.readFile(this.dataFilePath, 'utf-8');
      return JSON.parse(data) as Document[];
    } catch (error) {
      console.error('Ошибка при чтении JSON файла:', error);
      return [];
    }
  }

  async findOne(id: string): Promise<Document> {
    const documents = await this.findAll();
    const document = documents.find((doc) => doc.id === id);

    if (!document) {
      throw new NotFoundException(`Document with id ${id} not found`);
    }

    return document;
  }

  async remove(id: string): Promise<void> {
    try {
      const documents = await this.findAll();
      const documentToRemove = documents.find((doc) => doc.id === id);

      if (!documentToRemove) {
        throw new NotFoundException(`Document with id ${id} not found`);
      }

      if (documentToRemove.parentId) {
        const parentIndex = documents.findIndex(
          (doc) => doc.id === documentToRemove.parentId,
        );
        if (parentIndex !== -1) {
          documents[parentIndex].childrenIds = documents[
            parentIndex
          ].childrenIds.filter((child) => child !== id);
        }
      }

      const filteredDocuments = documents.filter((doc) => doc.id !== id);

      await this.saveData(filteredDocuments);
    } catch (error) {
      throw new HttpException(
        'Ошибка при удалении документа: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async saveData(documents: Document[]): Promise<void> {
    try {
      await fs.writeFile(this.dataFilePath, JSON.stringify(documents, null, 2));
    } catch (error) {
      console.error('Ошибка при записи в JSON файл:', error);
      throw new Error('Failed to save data to JSON file');
    }
  }
}
