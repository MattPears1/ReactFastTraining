import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import {AuthenticationComponent} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  TokenServiceBindings,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import {AuthorizationComponent} from '@loopback/authorization';
import {CronComponent} from '@loopback/cron';
import path from 'path';
import {MySequence} from './sequence';
import {SECURITY_SCHEME_SPEC} from './utils/security-spec';

export {ApplicationConfig};

export class ReactFastTrainingApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    // Authentication
    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    
    // Authorization
    this.component(AuthorizationComponent);
    
    // Cron jobs
    this.component(CronComponent);

    // Bind services
    this.bind('services.CourseSessionCapacityService').toClass(
      require('./services/course-session-capacity.service').CourseSessionCapacityService,
    );

    // Configure JWT
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(
      process.env.JWT_SECRET || 'react-fast-training-secret-key',
    );
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(
      process.env.JWT_EXPIRES_IN || '7d',
    );

    // API spec
    this.api({
      openapi: '3.0.0',
      info: {
        title: 'React Fast Training API',
        version: '1.0.0',
        description: 'Backend API for React Fast Training - First Aid Training Company in Yorkshire',
      },
      paths: {},
      components: {
        securitySchemes: SECURITY_SCHEME_SPEC,
      },
      servers: [{url: '/'}],
    });

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}