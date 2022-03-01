import {
  DynamicModule,
  Logger,
  Module,
  ModuleMetadata,
  Provider,
} from '@nestjs/common';
import { MigrationService as MigrationService } from './migration.service';
import { MorpheusModuleOptions } from './migration-service-options';

export interface MorpheusModuleOptionsFactory {
  createObjectionModuleOptions():
    | Promise<MorpheusModuleOptions>
    | MorpheusModuleOptions;
}

export interface MorpheusModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => MorpheusModuleOptions | Promise<MorpheusModuleOptions>;
  inject?: any[];
}

@Module({})
export class MorpheusModule {
  private static readonly logger = new Logger(MorpheusModule.name);

  static forRoot(options: MorpheusModuleOptions): DynamicModule {
    const providers = [
      {
        provide: MigrationService,
        useValue: new MigrationService(options),
      },
    ];

    return {
      providers: providers,
      exports: providers,
      module: MorpheusModule,
    };
  }

  public static forRootAsync(
    options: MorpheusModuleAsyncOptions,
  ): DynamicModule {
    const providers = [...this.createAsyncProviders(options)];
    return {
      module: MorpheusModule,
      imports: options.imports,
      providers: providers,
      exports: providers,
    };
  }

  private static createAsyncProviders(
    options: MorpheusModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: MorpheusModule,
          useFactory: async (...args: any[]) => {
            const asyncOptions = await options.useFactory(...args);
            return new MigrationService(asyncOptions);
          },
          inject: options.inject || [],
        },
      ];
    }
    this.logger.error(
      'MorpheusModule.forRootAsync() requires a useFactory function',
    );
    throw new Error('You must provide a useFactory function');
  }
}
