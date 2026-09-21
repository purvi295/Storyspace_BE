import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';

import { ROLES } from '../config/constants';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 100 })
    password: string;

    @Column({type:"varchar", length: 100})
    full_name: string;

    @Column({type:"varchar", length: 50, unique: true})
    username: string;

    @Column({ type: 'varchar', length: 50, default: ROLES.USER })
    role: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatar: string;
    
    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updated_at: Date;

    @ManyToOne(()=>User, (user)=>user.stories)
    user:[User];
}