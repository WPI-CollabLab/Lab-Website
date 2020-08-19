import {BaseEntity,Entity,Column,PrimaryGeneratedColumn,ManyToOne} from "typeorm";
import {User} from "./user";

@Entity()
export class Swipe extends BaseEntity {

    @PrimaryGeneratedColumn("numeric")
    id = undefined;

    @Column("text")
    time = "";

    @Column("text")
    direction = "";

    @ManyToOne(type => User, user => user.idNumber,{onDelete:'CASCADE'})
    user = undefined;
}