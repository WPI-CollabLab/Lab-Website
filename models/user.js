import {Entity, Column, BaseEntity, PrimaryColumn, OneToMany} from "typeorm";
import {Swipe} from "./swipe";

@Entity()
export class User extends BaseEntity{

    @Column()
    name: string;

    @PrimaryColumn()
    idNumber: number;

    @Column()
    labMonitor: boolean;

    @Column()
    exec: boolean;

    @Column()
    admin: boolean;

    @Column()
    needsPassword: boolean;

    @Column()
    displayName: boolean;

    @Column()
    nickname: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column()
    salt: string;

    @OneToMany(type => Swipe, visits => swipes.id)
    swipes: Swipe[];
}