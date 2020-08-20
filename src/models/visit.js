import {BaseEntity,Entity,Column,PrimaryGeneratedColumn,ManyToOne} from "typeorm";
import {User} from "./user";

@Entity()
export class Visit extends BaseEntity {

    @PrimaryGeneratedColumn("numeric")
    id = undefined;

    @Column("timestamp",{ nullable: false })
    inTime = undefined;

    @Column("timestamp",{ nullable: true })
    outTime = undefined;

    @ManyToOne(type => User, user => user.idNumber,{onDelete:'CASCADE'})
    user = undefined;
}