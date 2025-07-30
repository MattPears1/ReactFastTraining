import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  RestBindings,
  Request,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Course, CourseSession} from '../models';
import {CourseRepository} from '../repositories';

export class CourseController {
  constructor(
    @repository(CourseRepository)
    public courseRepository: CourseRepository,
  ) {}

  @post('/courses', {
    responses: {
      '200': {
        description: 'Course model instance',
        content: {'application/json': {schema: getModelSchemaRef(Course)}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Course, {
            title: 'NewCourse',
            exclude: ['id', 'createdAt', 'updatedAt'],
          }),
        },
      },
    })
    course: Omit<Course, 'id'>,
  ): Promise<Course> {
    return this.courseRepository.create(course);
  }

  @get('/courses/count', {
    responses: {
      '200': {
        description: 'Course model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Course) where?: Where<Course>,
  ): Promise<Count> {
    return this.courseRepository.count(where);
  }

  @get('/courses', {
    responses: {
      '200': {
        description: 'Array of Course model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Course, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Course) filter?: Filter<Course>,
  ): Promise<Course[]> {
    return this.courseRepository.find(filter);
  }

  @get('/courses/active', {
    responses: {
      '200': {
        description: 'Array of active Course model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Course),
            },
          },
        },
      },
    },
  })
  async findActive(): Promise<Course[]> {
    return this.courseRepository.findActiveCourses();
  }

  @get('/courses/type/{type}', {
    responses: {
      '200': {
        description: 'Array of Course model instances by type',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Course),
            },
          },
        },
      },
    },
  })
  async findByType(
    @param.path.string('type') type: string,
  ): Promise<Course[]> {
    return this.courseRepository.findByType(type);
  }

  @get('/courses/{id}', {
    responses: {
      '200': {
        description: 'Course model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Course, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Course, {exclude: 'where'}) filter?: FilterExcludingWhere<Course>,
  ): Promise<Course> {
    return this.courseRepository.findById(id, filter);
  }

  @patch('/courses/{id}', {
    responses: {
      '204': {
        description: 'Course PATCH success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Course, {partial: true}),
        },
      },
    })
    course: Course,
  ): Promise<void> {
    await this.courseRepository.updateById(id, {...course, updatedAt: new Date()});
  }

  @del('/courses/{id}', {
    responses: {
      '204': {
        description: 'Course DELETE success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin']})
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.courseRepository.deleteById(id);
  }

  @get('/courses/{id}/sessions', {
    responses: {
      '200': {
        description: 'Array of Course has many CourseSession',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(CourseSession)},
          },
        },
      },
    },
  })
  async findSessions(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<CourseSession>,
  ): Promise<CourseSession[]> {
    return this.courseRepository.sessions(id).find(filter);
  }

  @get('/courses/{id}/group-discount', {
    responses: {
      '200': {
        description: 'Calculate group discount for course',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                courseId: {type: 'string'},
                groupSize: {type: 'number'},
                discountPercentage: {type: 'number'},
                pricePerPerson: {type: 'number'},
                discountedPrice: {type: 'number'},
                totalSaving: {type: 'number'},
              },
            },
          },
        },
      },
    },
  })
  async calculateGroupDiscount(
    @param.path.string('id') id: string,
    @param.query.number('groupSize') groupSize: number,
  ): Promise<object> {
    const course = await this.courseRepository.findById(id);
    const discountPercentage = await this.courseRepository.calculateGroupDiscount(id, groupSize);
    const discountedPrice = course.pricePerPerson * (1 - discountPercentage);
    const totalSaving = (course.pricePerPerson - discountedPrice) * groupSize;

    return {
      courseId: id,
      groupSize,
      discountPercentage,
      pricePerPerson: course.pricePerPerson,
      discountedPrice,
      totalSaving,
    };
  }
}