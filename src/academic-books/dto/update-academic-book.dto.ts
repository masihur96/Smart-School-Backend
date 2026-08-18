import { PartialType } from '@nestjs/swagger';
import { CreateAcademicBookDto } from './create-academic-book.dto';

export class UpdateAcademicBookDto extends PartialType(CreateAcademicBookDto) {}
