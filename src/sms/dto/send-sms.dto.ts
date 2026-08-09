import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendSmsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  mobNumbers: string[];

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsBoolean()
  @IsOptional()
  isMasked?: boolean = false;
}
