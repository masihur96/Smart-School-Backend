import { PartialType } from '@nestjs/swagger';
import { CreateAcademicEbookDto } from './create-academic-ebook.dto';

export class UpdateAcademicEbookDto extends PartialType(CreateAcademicEbookDto) {}
