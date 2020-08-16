import {Entity, Column, BaseEntity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./user";

@Entity()
export class Swipe extends BaseEntity{

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    time: string;

    @Column()
    direction: string;

    @ManyToOne(type => User, user => user.idNumber)
    user: User;
}